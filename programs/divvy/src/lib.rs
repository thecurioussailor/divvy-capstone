pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod events;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;


declare_id!("HKbBGFwWNVYLa7MnyKVZoZNrVy9BthdizHXfKZNwGmZm");

#[program]
pub mod divvy {
    use super::*;

    pub fn initialize_split(ctx: Context<InitializeSplit>, split_id: u64) -> Result<()> {
        ctx.accounts.initialize_split(split_id, &ctx.bumps)
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

    pub fn activate_split(ctx: Context<ActivateSplit>) -> Result<()> {
        ctx.accounts.activate_split()
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim()
    }

    
}
