use crate::constants::{PRESALE_SEED, PRESALE_VAULT};
use crate::errors::PresaleError;
use crate::state::PresaleInfo;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

pub fn withdraw(ctx: Context<Withdraw>, amount: u64, withdraw_type: WithdrawType) -> Result<()> {
    let presale_info = &ctx.accounts.presale_info;

    if presale_info.authority != ctx.accounts.admin.key() {
        return Err(PresaleError::Unauthorized.into());
    }

    match withdraw_type {
        WithdrawType::Sol => {
            let vault_balance = ctx.accounts.presale_vault.lamports();
            if amount > vault_balance {
                return Err(PresaleError::InsufficientFunds.into());
            }

            **ctx.accounts.presale_vault.try_borrow_mut_lamports()? = ctx
                .accounts
                .presale_vault
                .lamports()
                .checked_sub(amount)
                .ok_or(PresaleError::Overflow)?;

            **ctx.accounts.admin.try_borrow_mut_lamports()? = ctx
                .accounts
                .admin
                .lamports()
                .checked_add(amount)
                .ok_or(PresaleError::Overflow)?;
        }
        WithdrawType::Token => {
            let remaining_tokens = presale_info
                .deposit_token_amount
                .checked_sub(presale_info.sold_token_amount)
                .ok_or(PresaleError::Overflow)?;
            if amount > remaining_tokens {
                return Err(PresaleError::InsufficientTokens.into());
            }

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.presale_token_account.to_account_info(),
                        to: ctx.accounts.admin_token_account.to_account_info(),
                        authority: ctx.accounts.presale_info.to_account_info(),
                    },
                    &[&[
                        PRESALE_SEED,
                        &[presale_info.presale_identifier],
                        &[ctx.bumps.presale_info],
                    ]],
                ),
                amount,
            )?;

            let presale_info = ctx.accounts.presale_info.as_mut();
            presale_info.deposit_token_amount = presale_info
                .deposit_token_amount
                .checked_sub(amount)
                .ok_or(PresaleError::Overflow)?;
        }
    }

    msg!("Withdrawal successful");
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [PRESALE_SEED, &[presale_info.presale_identifier]],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [PRESALE_VAULT, &[presale_info.presale_identifier]],
        bump,
    )]
    pub presale_vault: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub token_mint: Account<'info, token::Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = presale_info,
    )]
    pub presale_token_account: Account<'info, token::TokenAccount>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = token_mint,
        associated_token::authority = admin,
    )]
    pub admin_token_account: Account<'info, token::TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum WithdrawType {
    Sol,
    Token,
}
