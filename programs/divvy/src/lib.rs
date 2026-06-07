pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("HKbBGFwWNVYLa7MnyKVZoZNrVy9BthdizHXfKZNwGmZm");

#[program]
pub mod divvy {
    use super::*;

    // Protocol
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>, fee_bps: u16) -> Result<()> {
        ctx.accounts.initialize_protocol(fee_bps, &ctx.bumps)
    }
    
    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        ctx.accounts.withdraw_fees(&ctx.bumps)
    }

    //Users
    pub fn initialize_split(ctx: Context<InitializeSplit>, split_id: u64) -> Result<()> {
        ctx.accounts.initialize(split_id, &ctx.bumps)
    }

    pub fn add_member(
        ctx: Context<AddMember>,
        member: Pubkey,
        share_bps: u16,
    ) -> Result<()> {
        ctx.accounts.add_member(
            member, 
            share_bps, 
            &ctx.bumps
        )
    }

    pub fn update_allocation(
        ctx: Context<UpdateAllocation>,
        new_share_bps: u16,
    ) -> Result<()> {
        ctx.accounts.update_allocation(new_share_bps)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount, &ctx.bumps)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim()
    }
}
