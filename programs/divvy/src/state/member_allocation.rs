use anchor_lang::prelude::*;

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
