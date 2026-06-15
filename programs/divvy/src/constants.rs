use anchor_lang::prelude::*;

#[constant]
pub const SPLIT_SEED: &[u8] = b"split";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const MEMBER_SEED: &[u8] = b"member";

///Basis points representing 100%
pub const TOTAL_BPS: u16 = 10_000;

/// Upper bound on members per split (keep setup bounded)
pub const MAX_MEMBERS: u8 = 50;

