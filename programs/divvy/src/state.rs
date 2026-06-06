use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SplitConfig {
    /// The authority who manages this split (add/remove members, pause, close)
    pub authority: Pubkey,       // 32
    /// Current status of the split
    pub status: SplitStatus,     // 1
    /// Number of active members
    pub member_count: u8,        // 1
    /// The SPL token mint accepted by this split (e.g. USDC)
    pub token_mint: Pubkey,      // 32
    /// Cumulative total deposited into the vault (ever)
    pub total_deposited: u64,    // 8   
    pub total_allocated_bps: u16, // 2  // tracks running sum of all member share_bps
    /// Unique identifier for this split (allows one authority to have multiple splits)
    pub split_id: u64,           // 8
    /// PDA bump
    pub bump: u8,                // 1
    /// Vault bump
    pub vault_bump: u8,          // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum SplitStatus {
    Draft,
    Active,
    Paused,
    Closed,
}

#[account]
#[derive(InitSpace)]
pub struct MemberAllocation {
     /// The split this member belongs to
     pub split: Pubkey,           // 32
     /// The member's wallet address
     pub member: Pubkey,          // 32
     /// Share in basis points (e.g. 7000 = 70%, 10000 = 100%)
     pub share_bps: u16,          // 2
     /// Cumulative amount this member has already claimed
     pub total_claimed: u64,      // 8
     /// Snapshot of total_deposited at the time of last claim
     /// Used to calculate pending = (total_deposited * share_bps / 10000) - total_claimed
     pub last_snapshot: u64,      // 8
     /// PDA bump
     pub bump: u8,            
}

#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
     /// The wallet that can collect all protocol fees
     pub protocol_authority: Pubkey,  // 32
     /// Fee charged on every deposit in basis points (e.g. 50 = 0.5%)
     pub fee_bps: u16,                // 2
     /// PDA bump
     pub bump: u8,                    // 1
}