use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension::{
    transfer_fee::TransferFeeConfig, BaseStateWithExtensions, StateWithExtensions,
};
use anchor_spl::token_2022::spl_token_2022::state::Mint as MintState;
use anchor_spl::token_interface::Mint;

use crate::error::DivvyError;

/// Rejects mints that carry the Token-2022 transfer-fee extension. A transfer fee would make
/// the amount received by the vault differ from the amount sent, breaking deposit accounting.
/// Classic SPL Token mints have no extensions, so they always pass.
pub fn require_no_transfer_fee(mint: &InterfaceAccount<'_, Mint>) -> Result<()> {
    let mint_ai = mint.to_account_info();
    let data = mint_ai.try_borrow_data()?;
    if let Ok(state) = StateWithExtensions::<MintState>::unpack(&data) {
        if state.get_extension::<TransferFeeConfig>().is_ok() {
            return err!(DivvyError::TransferFeeNotSupported);
        }
    }
    Ok(())
}
