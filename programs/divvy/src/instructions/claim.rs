use anchor_lang::prelude::*;
use anchor_spl::token_interface::{ TokenInterface, Mint, TokenAccount, TransferChecked, transfer_checked};

use crate::constants::*;
use crate::events::ClaimEvent;
use crate::state::*;
use crate::error::DivvyError;

#[derive(Accounts)]
pub struct Claim<'info> {
    
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
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
        has_one = member @ DivvyError::Unauthorized,
        constraint = member_allocation.split == split_config.key() @ DivvyError::Unauthorized,
        seeds = [
            MEMBER_SEED,
            split_config.key().as_ref(),
            member.key().as_ref(),
        ],
        bump = member_allocation.bump,
    )]
    pub member_allocation: Account<'info, MemberAllocation>,

    #[account(
        mut,
        seeds = [VAULT_SEED, split_config.key().as_ref()],
        bump = split_config.vault_bump,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = member_token_account.mint == split_config.token_mint @ DivvyError::WrongMint,
        constraint = member_token_account.owner == member.key() @ DivvyError::Unauthorized,
    )]
    pub member_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Claim<'info> {
    pub fn claim(&mut self) -> Result<()> {
        self.split_config.require_claimable()?;
        
        let claimable = self
            .member_allocation
            .claimable(self.split_config.total_deposited)?;
        
        require!(claimable > 0, DivvyError::NothingToClaim);

        // The vault's authority is the split_config PDA; sign with its seeds.
        let authority_key  = self.split_config.authority;
        let split_id_bytes = self.split_config.split_id.to_le_bytes();
        
        let seeds = &[
            SPLIT_SEED,
            authority_key.as_ref(),
            split_id_bytes.as_ref(),
            &[self.split_config.bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let decimals = self.token_mint.decimals;
        
        let transfer_vault_to_member_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: self.member_token_account.to_account_info(),
            authority: self.split_config.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.key(),
            transfer_vault_to_member_accounts,
            signer_seeds,
        );

        transfer_checked(
            cpi_ctx,
            claimable,
            decimals
        )?;

        let new_claimed = self
            .member_allocation
            .total_claimed
            .checked_add(claimable)
            .ok_or(DivvyError::MathOverflow)?;
        
        self.member_allocation.total_claimed = new_claimed;

        emit!(ClaimEvent {
            split: self.split_config.key(),
            member: self.member.key(),
            amount: claimable,
            total_claimed: new_claimed,
        });
        
        Ok(())
    }
}