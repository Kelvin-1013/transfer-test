use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, TransferChecked};
use anchor_spl::token_interface::{Mint, Token2022, TokenAccount};

declare_id!("J8YgpQ4n6mzE9FdiMECZtRPXUKewue1mw76VADRg5jpe");

#[program]
pub mod token2022_transfer {
     use super::*;

    pub fn transfer_token2022(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        let transfer_cpi_accounts = TransferChecked {
            from: ctx.accounts.from_ata.clone().to_account_info(),
            to: ctx.accounts.to_ata.clone().to_account_info(),
            authority: ctx.accounts.from.clone().to_account_info(),
            mint: ctx.accounts.mint.clone().to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.clone().to_account_info(),
            transfer_cpi_accounts,
        );
        token_2022::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferToken<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub from_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub to_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub token_program: Program<'info, Token2022>,
}