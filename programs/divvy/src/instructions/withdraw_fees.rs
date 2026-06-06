use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer};
use crate::state::{ProtocolConfig, SplitConfig};
use crate::error::DivvyError;

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    /// Must be the protocol authority
    #[account(mut)]
    pub protocol_authority: Signer<'info>,

    /// Global protocol config — verifies the signer is the real protocol authority
    #[account(
        seeds = [b"protocol_config"],
        bump = protocol_config.bump,
        has_one = protocol_authority @ DivvyError::Unauthorized,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// The split whose fee vault we are draining
    #[account(
        seeds = [
            b"split",
            split_config.authority.as_ref(),
            split_config.split_id.to_le_bytes().as_ref(),
        ],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>,

    /// The fee vault to drain
    #[account(
        mut,
        seeds = [b"fee_vault", split_config.key().as_ref()],
        bump,
    )]
    pub fee_vault: Account<'info, TokenAccount>,

    /// Protocol authority's token account to receive the fees
    #[account(
        mut,
        constraint = protocol_token_account.owner == protocol_authority.key(),
        constraint = protocol_token_account.mint == fee_vault.mint,
    )]
    pub protocol_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> WithdrawFees<'info> {
    pub fn withdraw_fees(&mut self, bumps: &WithdrawFeesBumps) -> Result<()> {
        let fee_balance = self.fee_vault.amount;

        // Nothing to withdraw
        require!(fee_balance > 0, DivvyError::NothingToClaim);

        // PDA signer seeds for the split_config (which owns the fee_vault)
        let authority_key = self.split_config.authority.key();
        let split_id_bytes = self.split_config.split_id.to_le_bytes();
        let seeds = &[
            b"split",
            authority_key.as_ref(),
            split_id_bytes.as_ref(),
            &[self.split_config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = Transfer {
            from:      self.fee_vault.to_account_info(),
            to:        self.protocol_token_account.to_account_info(),
            authority: self.split_config.to_account_info(),
        };

        // CPI: transfer all fees from fee_vault → protocol_token_account
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.key(),
            accounts,
            signer_seeds,
        );

        transfer(cpi_ctx, fee_balance)?;

        Ok(())
    }
}