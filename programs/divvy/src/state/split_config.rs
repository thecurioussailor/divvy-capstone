use anchor_lang::prelude::*;
use crate::error::DivvyError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum SplitStatus {
    Draft,
    Active,
    Paused,
    Closed,
}

/// The pool's settings. One per (authority, split_id)
#[account]
#[derive(InitSpace)]
pub struct SplitConfig {
    /// Admin allowed to manage the split
    pub authority: Pubkey,

    /// The SPL mint this split accepts (e.g. USDC)
    pub token_mint: Pubkey,

    /// Distinguishes multiple splits owned by the same authority.
    pub split_id: u64,

    /// Lifecycle state.
    pub status: SplitStatus,

    /// Number of members added.
    pub member_count: u8,

    /// Running sum of member shares; must equal 10000 to activate
    pub total_bps: u16,

    /// Cumulative tokens ever deposited (basis for claim math)
    pub total_deposited: u64,

    /// Bump for the vault PDA
    pub vault_bump: u8,

    /// Bump for this config PDA
    pub bump: u8,
}

impl SplitConfig {
    pub fn require_active(&self) -> Result<()> {
        match self.status {
            SplitStatus::Active => Ok(()),
            SplitStatus::Draft => err!(DivvyError::SplitNotActive),
            SplitStatus::Paused => err!(DivvyError::SplitPaused),
            SplitStatus::Closed => err!(DivvyError::SplitClosed)
        }
    }
}