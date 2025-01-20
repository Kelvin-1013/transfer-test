use anchor_lang::prelude::*; 
use anchor_spl::token_2022::{self, TransferChecked}; 
use anchor_spl::token_interface::{Mint, Token2022, TokenAccount}; 
 
declare_id!("5oqAa8gcFcJN1fzdHADEFUqnRrZuAU34zEMaK5BDfAFx"); 
 
#[program] 
pub mod token2022_transfer_contract { 
    use super::*; 
 
    pub fn send_token( 
        ctx: Context<SendToken>, 
        amount: u64, 
    ) -> Result<()> { 
        let from_account = ctx.accounts.from.to_account_info(); 
        let token_program = ctx.accounts.token_program.to_account_info(); 
        let authority_info = ctx.accounts.authority.to_account_info(); 
        let to_account = ctx.accounts.recipient.to_account_info(); 
        let mint = ctx.accounts.mint.to_account_info(); 
 
        let transfer_cpi_accounts = TransferChecked { 
            from: from_account.clone(), 
            to: to_account.clone(), 
            authority: authority_info.clone(), 
            mint: mint.clone(), 
        }; 
 
        // Create a context for the transfer and execute the transfer_checked instruction. 
        let cpi_ctx = CpiContext::new(token_program.clone(), transfer_cpi_accounts); 
        token_2022::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?; 
 
        Ok(()) 
    } 
} 
 
#[derive(Accounts)] 
pub struct SendToken<'info> { 
    #[account(mut)] 
    pub from: Box<InterfaceAccount<'info, TokenAccount>>, 
    pub recipient: Box<InterfaceAccount<'info, TokenAccount>>, 
    pub authority: Signer<'info>, 
    #[account()] 
    pub mint: Box<InterfaceAccount<'info, Mint>>, 
    pub token_program: Program<'info, Token2022>, 
}