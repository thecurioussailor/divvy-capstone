use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::DivvyError;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdateStatus<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ DivvyError::Unauthorized,
        seeds = [SPLIT_SEED, split_config.authority.as_ref(), &split_config.split_id.to_le_bytes()],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>,
}

impl<'info> UpdateStatus<'info> {
    pub fn pause(&mut self) -> Result<()> {
        require!(self.split_config.status == SplitStatus::Active, DivvyError::SplitNotActive);
        self.split_config.status = SplitStatus::Paused;
        Ok(())
    }

    pub fn resume(&mut self) -> Result<()> {
        require!(self.split_config.status == SplitStatus::Paused, DivvyError::SplitNotPaused);
        
        // A partially torn-down split (members already closed) cannot be reactivated.
        require!(self.split_config.total_bps == TOTAL_BPS, DivvyError::TeardownInProgress);
        
        self.split_config.status = SplitStatus::Active;
        
        Ok(())
    }
}
