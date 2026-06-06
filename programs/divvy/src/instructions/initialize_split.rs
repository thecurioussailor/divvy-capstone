use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{SplitConfig, SplitStatus};

#[derive(Accounts)]
#[instruction(split_id: u64)]
pub struct InitializeSplit<'info> {
    /// The authority creating and managing this split
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The SplitConfig PDA
    /// Seeds: ["split", authority, split_id]
    #[account(
        init,
        payer = authority,
        space = SplitConfig::DISCRIMINATOR.len() + SplitConfig::INIT_SPACE,
        seeds = [
            b"split",
            authority.key().as_ref(),
            split_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = split_config,
        seeds = [b"vault", split_config.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = split_config,
        seeds = [b"fee_vault", split_config.key().as_ref()],
        bump
    )]
    pub fee_vault: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
     
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeSplit<'info> {
    pub fn initialize(&mut self, split_id: u64, bumps: &InitializeSplitBumps) -> Result<()> {
        self.split_config.set_inner(SplitConfig {
            authority:       self.authority.key(),
            status:          SplitStatus::Active,
            member_count:    0,
            token_mint:      self.token_mint.key(),
            total_deposited: 0,
            total_allocated_bps: 0,
            split_id,
            bump:            bumps.split_config,
            vault_bump:      bumps.vault,
        });

        Ok(())
    }
}
