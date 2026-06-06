use anchor_lang::prelude::*;

use crate::{
    state::{
        SplitConfig,
        MemberAllocation,
        SplitStatus
    },
    error::DivvyError

};


#[derive(Accounts)]
#[instruction(member: Pubkey, share_bps: u16)]
pub struct AddMember<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"split",
            authority.key().as_ref(),
            split_config.split_id.to_le_bytes().as_ref(),
        ],
        bump = split_config.bump,
        has_one = authority @ DivvyError::Unauthorized,
    )]
    pub split_config: Account<'info, SplitConfig>,

    #[account(
        init,
        payer = authority,
        space = MemberAllocation::DISCRIMINATOR.len() + MemberAllocation::INIT_SPACE,
        seeds = [
            b"member",
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
        
        // 1. Split must be active
        require!(
            self.split_config.status == SplitStatus::Active,
            DivvyError::SplitNotActive
        );

        // 2. share_bps cannot be zero
        require!(share_bps > 0, DivvyError::ZeroShareBps);

        // 3. share_bps cannot exceed 10_000
        require!(share_bps <= 10_000, DivvyError::ShareBpsOverflow);

        // Check adding this member won't exceed 10_000 bps
        let new_total = self.split_config.total_allocated_bps
        .checked_add(share_bps)
        .ok_or(DivvyError::ShareBpsOverflow)?;

        require!(new_total <= 10_000, DivvyError::InvalidTotalAllocation);

         // 4. Set member allocation
         self.member_allocation.set_inner(MemberAllocation {
            split:         self.split_config.key(),
            member,
            share_bps,
            total_claimed: 0,
            last_snapshot: 0,
            bump:          bumps.member_allocation,
        });

        // Update running total on split config
        self.split_config.total_allocated_bps = new_total;
        self.split_config.member_count += 1;

        Ok(())
    }
}