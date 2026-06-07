use anchor_lang::prelude::*;
use crate::state::{SplitConfig, MemberAllocation, SplitStatus};
use crate::error::DivvyError;

#[derive(Accounts)]
#[instruction(new_share_bps: u16)]
pub struct UpdateAllocation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"split",
            authority.key().as_ref(),
            split_config.split_id.to_le_bytes().as_ref(),
        ],
        bump = split_config.bump,
        has_one = authority @ DivvyError::Unauthorized,
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(
        mut,
        seeds = [
            b"member",
            split_config.key().as_ref(),
            member_allocation.member.as_ref(),
        ],
        bump = member_allocation.bump,
        constraint = member_allocation.split == split_config.key() 
            @ DivvyError::Unauthorized,
    )]
    pub member_allocation: Account<'info, MemberAllocation>,
}

impl<'info> UpdateAllocation<'info> {
    pub fn update_allocation(&mut self, new_share_bps: u16) -> Result<()> {
        // 1. Split must be active
        require!(
            self.split_config.status == SplitStatus::Active,
            DivvyError::SplitNotActive
        );

        // 2. New share cannot be zero
        require!(new_share_bps > 0, DivvyError::ZeroShareBps);

        // 3. New share cannot exceed 10_000
        require!(new_share_bps <= 10_000, DivvyError::ShareBpsOverflow);

        let old_share_bps = self.member_allocation.share_bps as u64;
        let new_share_bps_u64 = new_share_bps as u64;
        let total_deposited = self.split_config.total_deposited;

        // 4. Check new total allocated bps won't exceed 10_000
        //    Remove old share, add new share
        let new_total = self.split_config.total_allocated_bps
            .checked_sub(self.member_allocation.share_bps)
            .ok_or(DivvyError::MathOverflow)?
            .checked_add(new_share_bps)
            .ok_or(DivvyError::MathOverflow)?;

        require!(new_total <= 10_000, DivvyError::InvalidTotalAllocation);

        // 5. Snapshot fix — recalculate total_claimed based on new share_bps
        //    so the lazy math stays consistent going forward
        //
        //    What has this member "virtually claimed" at the new rate
        //    up to the current total_deposited?
        //    We set total_claimed = entitlement at new rate up to now
        //    so pending immediately after update = 0
        //
        //    This forces them to have claimed everything up to this point
        //    at the new rate. Future deposits will accrue at the new rate.
        let new_total_claimed = total_deposited
            .checked_mul(new_share_bps_u64)
            .ok_or(DivvyError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(DivvyError::MathOverflow)?;

        // 6. Apply updates
        self.member_allocation.share_bps     = new_share_bps;
        self.member_allocation.total_claimed = new_total_claimed;
        self.member_allocation.last_snapshot = total_deposited;

        // 7. Update running total on split config
        self.split_config.total_allocated_bps = new_total;

        Ok(())
    }
}