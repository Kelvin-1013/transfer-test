use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

pub fn buy_and_claim_token(ctx: Context<BuyAndClaimToken>, token_amount: u64) -> Result<()> {
    msg!("Program ID: {:?}", ctx.program_id);

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.from_account.to_account_info(),
                to: ctx.accounts.to_account.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
            &[&[b"BUYER_ACCOUNT"]],
        ),
        token_amount,
    )?;


    msg!("Tokens bought and claimed successfully");
    Ok(())
}

#[derive(Accounts)]
#[instruction(token_amount: u64)]
pub struct BuyAndClaimToken<'info> {
    #[account(mut)]
    pub token_mint: Account<'info, token::Mint>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = token_mint,
        associated_token::authority = buyer,
    )]
    pub from_account: Account<'info, token::TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = token_mint,
        associated_token::authority = buyer,
    )]
    pub to_account: Account<'info, token::TokenAccount>,

    /// CHECK: This is not dangerous

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}
