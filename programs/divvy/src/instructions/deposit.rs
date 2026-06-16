use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked};

use crate::state::*;
use crate::error::DivvyError;
use crate::events::DepositEvent;
use crate::constants::*;

#[derive(Accounts)]
pub struct Deposit<'info> {

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [
            SPLIT_SEED,
            split_config.authority.as_ref(),
            split_config.split_id.to_le_bytes().as_ref(),
        ],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(address = split_config.token_mint @ DivvyError::WrongMint)]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [VAULT_SEED, split_config.key().as_ref()],
        bump = split_config.vault_bump,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = depositor_token_account.mint == split_config.token_mint @ DivvyError::WrongMint,
        constraint = depositor_token_account.owner == depositor.key() @DivvyError::Unauthorized,
    )]
    pub depositor_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, DivvyError::ZeroAmount);
        self.split_config.require_active()?;

        let transfer_to_vault_accounts = TransferChecked {
            from: self.depositor_token_account.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.depositor.to_account_info()
        };

        let transfer_to_vault_ctx = CpiContext::new(
            self.token_program.key(),
            transfer_to_vault_accounts,
        );

        transfer_checked(
            transfer_to_vault_ctx, 
            amount, 
            self.token_mint.decimals
        )?;

        // 7. Update total_deposited with net amount only
        self.split_config.total_deposited = self
            .split_config
            .total_deposited
            .checked_add(amount)
            .ok_or(DivvyError::MathOverflow)?;

        emit!(DepositEvent {
            split: self.split_config.key(),
            payer: self.depositor.key(),
            amount,
            total_deposited: self.split_config.total_deposited,
        });

        Ok(())
    }
}