use anchor_lang::prelude::*;

#[error_code]
pub enum DivvyError {
   // --- Authorization Errors ---
   #[msg("You are not the authority of this split.")]
   Unauthorized,

   #[msg("Only the designated member can claim their share.")]
   NotMember,

   // --- Split Status Errors ---
   #[msg("This split is paused. Deposits and claims are disabled.")]
   SplitPaused,

   #[msg("This split is closed.")]
   SplitClosed,

   #[msg("This split is not active yet.")]
   SplitNotActive,

   #[msg("Split is already in the requested state.")]
   AlreadyInState,

   // --- Member Errors ---
   #[msg("Member already exists in this split.")]
   MemberAlreadyExists,

   #[msg("Cannot remove member with unclaimed balance.")]
   UnclaimedBalanceExists,

   #[msg("Maximum member count reached.")]
   MaxMembersReached,

   // --- Claim Errors ---
   #[msg("Nothing to claim. Your pending balance is zero.")]
   NothingToClaim,

   // --- Allocation Errors ---
   #[msg("Total allocations must equal exactly 10,000 basis points (100%).")]
   InvalidTotalAllocation,

   #[msg("Share basis points cannot be zero.")]
   ZeroShareBps,

   #[msg("Share basis points cannot exceed 10,000.")]
   ShareBpsOverflow,

   // --- Close Errors ---
   #[msg("Cannot close split. Vault still holds tokens.")]
   VaultNotEmpty,

   #[msg("Cannot close split. Members still have unclaimed balances.")]
   BalanceNotZero,

   #[msg("Deposit amount must be greater than zero.")]
    InvalidAmount,

    #[msg("Math overflow occurred.")]
    MathOverflow,
    
}
