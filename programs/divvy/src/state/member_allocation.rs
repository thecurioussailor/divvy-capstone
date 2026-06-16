use anchor_lang::prelude::*;

use crate::constants::TOTAL_BPS;
use crate::error::DivvyError;
/// One per member of a split. Allocation is fixed once the split is activated.
#[account]
#[derive(InitSpace)]
pub struct MemberAllocation {
    /// The split this allocation belongs to.
    pub split: Pubkey,
    /// The member's wallet.
    pub member: Pubkey,
    /// Fixed share in basis points (10000 = 100%).
    pub share_bps: u16,
    /// Cumulative amount this member has already claimed.
    pub total_claimed: u64,
    /// Bump for this PDA.
    pub bump: u8,
}

impl MemberAllocation {
    /// claimable = floor(total_deposited * share_bps / 10000) - total_claimed
    pub fn claimable(&self, total_deposited: u64) -> Result<u64> {
        let entitled = (total_deposited as u128)
            .checked_mul(self.share_bps as u128)
            .ok_or(DivvyError::MathOverflow)?
            .checked_div(TOTAL_BPS as u128)
            .ok_or(DivvyError::MathOverflow)? as u64;
        let claimable = entitled
            .checked_sub(self.total_claimed)
            .ok_or(DivvyError::MathOverflow)?;
        Ok(claimable)
    }
}