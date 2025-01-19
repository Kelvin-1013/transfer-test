use anchor_lang::prelude::*;

mod instructions;
mod state;
mod errors;
mod constants;

use instructions::*;
use errors::PresaleError;

declare_id!("3YFtZDY3GqWCp3wiQavEyxkk1vgwCYVRkuc5Cmx2uoPN");

#[program]
pub mod token_presale {
    use super::*;
 
    pub fn buy_and_claim_token(ctx: Context<BuyAndClaimToken>, token_amount: u64) -> Result<()> {
        instructions::buy_and_claim_token::buy_and_claim_token(ctx, token_amount)
    }
}