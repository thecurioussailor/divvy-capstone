use anchor_lang::prelude::*;

#[event]
pub struct DepositEvent {
    pub split: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
    pub total_deposited: u64
}

#[event]
pub struct ClaimEvent {
    pub split: Pubkey,
    pub member: Pubkey,
    pub amount: u64,
    pub total_claimed: u64,
}