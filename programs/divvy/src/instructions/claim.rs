use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::ProtocolConfig;
use crate::state::{SplitConfig, MemberAllocation, SplitStatus};
use crate::error::DivvyError;

#[derive(Accounts)]
pub struct Claim<'info> {
    /// Must be the member themselves — only they can claim their share
    #[account(mut)]
    pub member: Signer<'info>,

    // Add protocol_config to the Deposit accounts struct
    #[account(
        seeds = [b"protocol_config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

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

    #[account(
        mut,
        seeds = [
            b"member",
            split_config.key().as_ref(),
            member.key().as_ref(),
        ],
        bump = member_allocation.bump,
        // Ensures this MemberAllocation belongs to the signer
        constraint = member_allocation.member == member.key() 
            @ DivvyError::NotMember,
        constraint = member_allocation.split == split_config.key() 
            @ DivvyError::Unauthorized,
    )]
    pub member_allocation: Account<'info, MemberAllocation>,

    /// Vault that holds the revenue tokens
    #[account(
        mut,
        seeds = [b"vault", split_config.key().as_ref()],
        bump = split_config.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Member's token account to receive their share
    #[account(
        mut,
        constraint = member_token_account.owner == member.key() 
            @ DivvyError::Unauthorized,
        constraint = member_token_account.mint == split_config.token_mint 
            @ DivvyError::Unauthorized,
    )]
    pub member_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn claim(&mut self) -> Result<()> {
        // 1. Split must be active
        require!(
            self.split_config.status == SplitStatus::Active,
            DivvyError::SplitPaused
        );

        // 2. Calculate how much this member is entitled to in total
        //    based on ALL deposits ever made
        let total_deposited  = self.split_config.total_deposited;
        let share_bps        = self.member_allocation.share_bps as u64;

        let total_entitled = total_deposited
            .checked_mul(share_bps)
            .ok_or(DivvyError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(DivvyError::MathOverflow)?;

        // 3. Subtract what they have already claimed
        let total_claimed = self.member_allocation.total_claimed;

        let pending = total_entitled
            .checked_sub(total_claimed)
            .ok_or(DivvyError::MathOverflow)?;

        // 4. Nothing to claim
        require!(pending > 0, DivvyError::NothingToClaim);

        // 5. PDA signer seeds — split_config is the vault authority
        let authority_key  = self.split_config.authority.key();
        let split_id_bytes = self.split_config.split_id.to_le_bytes();
        let seeds = &[
            b"split" as &[u8],
            authority_key.as_ref(),
            split_id_bytes.as_ref(),
            &[self.split_config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // 6. CPI: transfer pending amount from vault → member token account
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.key(),
            Transfer {
                from:      self.vault.to_account_info(),
                to:        self.member_token_account.to_account_info(),
                authority: self.split_config.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi_ctx, pending)?;

        // 7. Update member's claimed amount and snapshot
        self.member_allocation.total_claimed = self.member_allocation
            .total_claimed
            .checked_add(pending)
            .ok_or(DivvyError::MathOverflow)?;

        self.member_allocation.last_snapshot = total_deposited;

        Ok(())
    }
}