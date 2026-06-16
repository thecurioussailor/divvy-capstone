use anchor_lang::prelude::*;

use crate::state::*;
use crate::error::DivvyError;
use crate::constants::*;

#[derive(Accounts)]
pub struct ActivateSplit<'info> {

    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ DivvyError::Unauthorized,
        seeds = [SPLIT_SEED, split_config.authority.as_ref(), split_config.split_id.to_le_bytes().as_ref()],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>
}

impl<'info> ActivateSplit<'info> {
    pub fn activate_split(&mut self) -> Result<()> {
        
        require!(self.split_config.status == SplitStatus::Draft, DivvyError::SplitNotDraft);
        require!(self.split_config.member_count > 0, DivvyError::NoMembers);
        require!(self.split_config.total_bps == TOTAL_BPS, DivvyError::InvalidAllocationSum);
        
        self.split_config.status = SplitStatus::Active;
        
        Ok(())
    }
}