use anchor_lang::prelude::*;

#[error_code]
pub enum DivvyError {
    #[msg("Allocations must sum to exactly 10000 basis points")]
    InvalidAllocationSum,

    #[msg("The split must have at least one member")]
    NoMembers,

    #[msg("Too many members for this split")]
    TooManyMembers,

    #[msg("The split is not active")]
    SplitNotActive,

    #[msg("The split is paused")]
    SplitPaused,

    #[msg("The split is closed")]
    SplitClosed,

    #[msg("The split must be in draft for this action")]
    SplitNotDraft,

    #[msg("The split is not paused")]
    SplitNotPaused,

    #[msg("Only the authority may perform this action")]
    Unauthorized,
    
    #[msg("Nothing is available to claim")]
    NothingToClaim,
    
    #[msg("Arithmetic overflow")]
    MathOverflow,
    
    #[msg("The vault must be empty before closing")]
    VaultNotEmpty,
    
    #[msg("Share must be greater than zero")]
    ZeroShare,
    
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    
    #[msg("Token account mint does not match the split")]
    WrongMint,

    #[msg("Mints with a transfer-fee extension are not supported")]
    TransferFeeNotSupported,
    
    #[msg("Member still has unclaimed funds")]
    MemberHasUnclaimedFunds,
    
    #[msg("All members must be closed before closing the split")]
    MembersRemaining,
    
    #[msg("Cannot resume a split whose teardown has started")]
    TeardownInProgress,
}
