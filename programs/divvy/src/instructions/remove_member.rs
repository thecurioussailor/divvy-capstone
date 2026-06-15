use anchor_lang::prelude::*;
use crate::state::{SplitConfig, MemberAllocation, SplitStatus};
use crate::error::DivvyError;

#[derive(Accounts)]
pub struct RemoveMember<'info> {
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
        // Closes the account and sends rent back to authority
        close = authority,
    )]
    pub member_allocation: Account<'info, MemberAllocation>,

    pub system_program: Program<'info, System>,
}

impl<'info> RemoveMember<'info> {
    pub fn remove_member(&mut self) -> Result<()> {
        // 1. Split must be active
        require!(
            self.split_config.status == SplitStatus::Active,
            DivvyError::SplitNotActive
        );

        // 2. Check member has no unclaimed balance
        //    They must claim everything before being removed
        let total_deposited = self.split_config.total_deposited;
        let share_bps       = self.member_allocation.share_bps as u64;

        let total_entitled = total_deposited
            .checked_mul(share_bps)
            .ok_or(DivvyError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(DivvyError::MathOverflow)?;

        let pending = total_entitled
            .checked_sub(self.member_allocation.total_claimed)
            .ok_or(DivvyError::MathOverflow)?;

        require!(pending == 0, DivvyError::UnclaimedBalanceExists);

        // 3. Remove their share from the running total
        self.split_config.total_allocated_bps = self.split_config
            .total_allocated_bps
            .checked_sub(self.member_allocation.share_bps)
            .ok_or(DivvyError::MathOverflow)?;

        // 4. Decrement member count
        self.split_config.member_count = self.split_config
            .member_count
            .checked_sub(1)
            .ok_or(DivvyError::MathOverflow)?;

        // Note: the account itself is closed via `close = authority`
        // in the account constraint above — Anchor handles this automatically

        Ok(())
    }
}