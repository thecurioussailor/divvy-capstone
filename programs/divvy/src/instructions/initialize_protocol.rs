// Level 1 — Single wallet (what I'm doing)
// My personal wallet is the protocol authority. Simple, works, but it's a single point of failure. If I lose the private key, fees are stuck forever. No one trusts a protocol where one person controls everything.

// Future Plan to integrate level 2 for production
// Level 2 — Multisig (what real protocols do)
// Instead of a personal wallet, the protocol authority is a multisig wallet like Squads Protocol (the standard on Solana). A multisig requires e.g. 3 out of 5 team members to sign any transaction. No single person can drain fees or change protocol settings. This is what Jupiter, Drift, Marinade etc. all use.

// Level 3 — DAO / Governance (fully decentralized)
// The protocol authority is a governance program. Token holders vote on fee changes, upgrades, fee withdrawals. Nobody has unilateral control. This is the endgame for fully decentralized protocols.

use anchor_lang::prelude::*;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    /// The wallet deploying the protocol — becomes the protocol authority
    #[account(mut)]
    pub protocol_authority: Signer<'info>,

    /// Global protocol config PDA — one for the entire program
    #[account(
        init,
        payer = protocol_authority,
        space = ProtocolConfig::DISCRIMINATOR.len() + ProtocolConfig::INIT_SPACE,
        seeds = [b"protocol_config"],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeProtocol<'info> {
    pub fn initialize_protocol(
        &mut self,
        fee_bps: u16,
        bumps: &InitializeProtocolBumps,
    ) -> Result<()> {
        self.protocol_config.set_inner(ProtocolConfig {
            protocol_authority: self.protocol_authority.key(),
            fee_bps,
            bump: bumps.protocol_config,
        });

        Ok(())
    }
}