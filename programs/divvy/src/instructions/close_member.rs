use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::DivvyError;
use crate::state::*;

#[derive(Accounts)]
#[instruction(member: Pubkey)]
pub struct CloseMember<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ DivvyError::Unauthorized,
        seeds = [SPLIT_SEED, split_config.authority.as_ref(), split_config.split_id.to_le_bytes().as_ref()],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(
        mut,
        close = authority,
        constraint = member_allocation.split == split_config.key() @ DivvyError::Unauthorized,
        seeds = [MEMBER_SEED, split_config.key().as_ref(), member.as_ref()],
        bump = member_allocation.bump,
    )]
    pub member_allocation: Account<'info, MemberAllocation>,
}

impl<'info> CloseMember<'info> {
    pub fn close_member(&mut self, _member: Pubkey) -> Result<()> {
        require!(self.split_config.status == SplitStatus::Paused, DivvyError::SplitNotPaused);

        // The member must have already claimed everything they are owed.
        let claimable = self
            .member_allocation
            .claimable(self.split_config.total_deposited)?;

        require!(claimable == 0, DivvyError::MemberHasUnclaimedFunds);

        self.split_config.member_count = self
            .split_config
            .member_count
            .checked_sub(1)
            .ok_or(DivvyError::MathOverflow)?;
        
        self.split_config.total_bps = self
            .split_config
            .total_bps
            .checked_sub(self.member_allocation.share_bps)
            .ok_or(DivvyError::MathOverflow)?;
        Ok(())
    }
}
