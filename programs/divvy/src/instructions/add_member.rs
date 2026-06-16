use anchor_lang::prelude::*;

use crate::state::*;
use crate::error::DivvyError;
use crate::constants::*;


#[derive(Accounts)]
#[instruction(member: Pubkey, share_bps: u16)]
pub struct AddMember<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ DivvyError::Unauthorized,
        seeds = [
            SPLIT_SEED,
            authority.key().as_ref(),
            split_config.split_id.to_le_bytes().as_ref(),
        ],
        bump = split_config.bump,
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(
        init,
        payer = authority,
        space = MemberAllocation::DISCRIMINATOR.len() + MemberAllocation::INIT_SPACE,
        seeds = [
            MEMBER_SEED,
            split_config.key().as_ref(),
            member.as_ref(),
        ],
        bump
    )]
    pub member_allocation: Account<'info, MemberAllocation>,

    pub system_program: Program<'info, System>,
}

impl<'info> AddMember<'info> {
    pub fn add_member(
        &mut self,
        member: Pubkey,
        share_bps: u16,
        bumps: &AddMemberBumps
    ) -> Result<()> {
        
        require!(self.split_config.status == SplitStatus::Draft, DivvyError::SplitNotDraft);
        require!(share_bps > 0, DivvyError::ZeroShare);
      
        // Check adding this member won't exceed 10_000 bps
        let new_total = self
            .split_config
            .total_bps
            .checked_add(share_bps)
            .ok_or(DivvyError::MathOverflow)?;

        require!(new_total <= TOTAL_BPS, DivvyError::InvalidAllocationSum);

        let new_count = self
            .split_config
            .member_count
            .checked_add(1)
            .ok_or(DivvyError::TooManyMembers)?;
        
        require!(new_count <= MAX_MEMBERS, DivvyError::TooManyMembers);

        let split_key = self.split_config.key();
        
         // Set member allocation
         self.member_allocation.set_inner(MemberAllocation {
            split: split_key,
            member,
            share_bps,
            total_claimed: 0,
            bump: bumps.member_allocation,
        });

        // Update running total on split config
        self.split_config.total_bps = new_total;
        self.split_config.member_count = new_count;

        Ok(())
    }
}