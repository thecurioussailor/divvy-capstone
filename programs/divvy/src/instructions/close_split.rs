use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked, close_account
};

use crate::constants::*;
use crate::error::DivvyError;
use crate::state::*;

#[derive(Accounts)]
pub struct CloseSplit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ DivvyError::Unauthorized,
        seeds = [SPLIT_SEED, split_config.authority.as_ref(), &split_config.split_id.to_le_bytes()],
        bump = split_config.bump,
        close = authority,
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
        constraint = authority_token_account.mint == split_config.token_mint @ DivvyError::WrongMint,
        constraint = authority_token_account.owner == authority.key() @ DivvyError::Unauthorized,
    )]
    pub authority_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> CloseSplit<'info> {
    pub fn close_split(&mut self) -> Result<()> {
        require!(self.split_config.status == SplitStatus::Paused, DivvyError::SplitNotPaused);
        require!(self.split_config.member_count == 0, DivvyError::MembersRemaining);

        let authority_key = self.split_config.authority;
        let split_id_bytes = self.split_config.split_id.to_le_bytes();

        let seeds = &[
            SPLIT_SEED,
            authority_key.as_ref(),
            split_id_bytes.as_ref(),
            &[self.split_config.bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let decimals = self.token_mint.decimals;

        // Every member is closed and was fully claimed, so anything left is rounding dust.
        // Sweep it to the authority so the vault can be closed (CloseAccount needs zero balance).
        let dust = self.vault.amount;

        let transfer_dust_vault_to_authority_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: self.authority_token_account.to_account_info(),
            authority: self.split_config.to_account_info(),
        };

        if dust > 0 {
            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.key(),
                    transfer_dust_vault_to_authority_accounts,
                    signer_seeds,
                ),
                dust,
                decimals,
            )?;
        }

        // Close the vault token account, returning its rent to the authority.
        close_account(CpiContext::new_with_signer(
            self.token_program.key(),
            CloseAccount {
                account: self.vault.to_account_info(),
                destination: self.authority.to_account_info(),
                authority: self.split_config.to_account_info(),
            },
            signer_seeds,
        ))?;
        
        Ok(())
    }
}