use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::{SplitConfig, SplitStatus};
use crate::constants::*;

#[derive(Accounts)]
#[instruction(split_id: u64)]
pub struct InitializeSplit<'info> {

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = SplitConfig::DISCRIMINATOR.len() + SplitConfig::INIT_SPACE,
        seeds = [
            SPLIT_SEED,
            authority.key().as_ref(),
            split_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(
        init,
        payer = authority,
        seeds = [VAULT_SEED, split_config.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = split_config,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeSplit<'info> {
    pub fn initialize_split(&mut self, split_id: u64, bumps: &InitializeSplitBumps) -> Result<()> {
        self.split_config.set_inner(SplitConfig {
            authority:       self.authority.key(),
            token_mint:      self.token_mint.key(),
            split_id,
            status:          SplitStatus::Draft,
            member_count:    0,
            total_bps: 0,
            total_deposited: 0,
            vault_bump:      bumps.vault,
            bump:            bumps.split_config,
        });
        Ok(())
    }
}
