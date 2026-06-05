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

    pub fn initialize_split(ctx: Context<InitializeSplit>, split_id: u64) -> Result<()> {
        ctx.accounts.initialize(split_id, &ctx.bumps)
    }
}
