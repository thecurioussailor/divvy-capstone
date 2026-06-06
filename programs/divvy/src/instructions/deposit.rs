use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{SplitConfig, SplitStatus};
use crate::error::DivvyError;

// Fee in basis points charged on every deposit (e.g. 50 = 0.5%)
pub const DEPOSIT_FEE_BPS: u64 = 50;

#[derive(Accounts)]
pub struct Deposit<'info> {
    /// Anyone can deposit — no authority check needed
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"split",
            split_config.authority.as_ref(),
            split_config.split_id.to_le_bytes().as_ref(),
        ],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>,

    /// Vault that holds the revenue tokens
    #[account(
        mut,
        seeds = [b"vault", split_config.key().as_ref()],
        bump = split_config.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Fee vault that holds protocol fees
    #[account(
        mut,
        seeds = [b"fee_vault", split_config.key().as_ref()],
        bump,
    )]
    pub fee_vault: Account<'info, TokenAccount>,

    /// Depositor's token account (source of funds)
    #[account(
        mut,
        constraint = depositor_token_account.mint == split_config.token_mint,
        constraint = depositor_token_account.owner == depositor.key(),
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64, bumps: &DepositBumps) -> Result<()> {
        // 1. Split must be active
        require!(
            self.split_config.status == SplitStatus::Active,
            DivvyError::SplitPaused
        );

        // 2. All allocations must sum to 10,000 bps before any deposit
        require!(
            self.split_config.total_allocated_bps == 10_000,
            DivvyError::InvalidTotalAllocation
        );

        // 3. Amount must be greater than zero
        require!(amount > 0, DivvyError::InvalidAmount);

        // 4. Calculate fee and net amount
        let fee = amount
            .checked_mul(DEPOSIT_FEE_BPS)
            .ok_or(DivvyError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(DivvyError::MathOverflow)?;

        let net_amount = amount
            .checked_sub(fee)
            .ok_or(DivvyError::MathOverflow)?;

        // 5. Transfer net amount from depositor → vault
        let transfer_to_vault_ctx = CpiContext::new(
            self.token_program.key(),
            Transfer {
                from:      self.depositor_token_account.to_account_info(),
                to:        self.vault.to_account_info(),
                authority: self.depositor.to_account_info(),
            },
        );
        token::transfer(transfer_to_vault_ctx, net_amount)?;

        // 6. Transfer fee from depositor → fee vault
        let transfer_fee_ctx = CpiContext::new(
            self.token_program.key(),
            Transfer {
                from:      self.depositor_token_account.to_account_info(),
                to:        self.fee_vault.to_account_info(),
                authority: self.depositor.to_account_info(),
            },
        );
        token::transfer(transfer_fee_ctx, fee)?;

        // 7. Update total_deposited with net amount only
        self.split_config.total_deposited = self.split_config
            .total_deposited
            .checked_add(net_amount)
            .ok_or(DivvyError::MathOverflow)?;

        Ok(())
    }
}