use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};
use crate::state::{PresaleInfo, BuyerAccount};
use crate::constants::{PRESALE_SEED, PRESALE_VAULT};
use crate::errors::PresaleError;

pub fn buy_and_claim_token(ctx: Context<BuyAndClaimToken>, token_amount: u64) -> Result<()> {
    msg!("Vault owner: {:?}", ctx.accounts.presale_vault.owner);
    msg!("Program ID: {:?}", ctx.program_id);
    msg!("Vault data empty: {:?}", ctx.accounts.presale_vault.data_is_empty());

    if ctx.accounts.presale_authority.owner != ctx.program_id {
        return Err(PresaleError::InvalidPresaleAuthority.into());
    }

    if ctx.accounts.presale_vault.owner != ctx.program_id {
        return Err(PresaleError::InvalidVaultOwner.into());
    }

    let expected_buyer_token_account = anchor_spl::associated_token::get_associated_token_address(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.token_mint.key(),
    );

    if ctx.accounts.buyer_token_account.key() != expected_buyer_token_account {
        return Err(PresaleError::InvalidTokenAccount.into());
    }

    let expected_presale_token_account = anchor_spl::associated_token::get_associated_token_address(
        &ctx.accounts.presale_authority.key(),
        &ctx.accounts.token_mint.key(),
    );
    if ctx.accounts.presale_token_account.key() != expected_presale_token_account {
        return Err(PresaleError::InvalidTokenAccount.into());
    }
    
    let presale_info = &mut ctx.accounts.presale_info;
    const TIME_BUFFER: i64 = 30;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    if !presale_info.is_initialized {
        return Err(PresaleError::PresaleNotInitialized.into());
    }


    let buyer_account = &mut ctx.accounts.buyer_account;
    let new_purchase_amount = buyer_account.purchased_amount
        .checked_add(token_amount)
        .ok_or(PresaleError::Overflow)?;
    
    if new_purchase_amount > presale_info.max_token_amount_per_address {
        return Err(PresaleError::ExceedsMaxPerAddress.into());
    }
    
    let actual_token_amount = token_amount
        .checked_mul(presale_info.decimal_per_token)
        .ok_or(PresaleError::Overflow)?;

        let new_sold_amount = presale_info.sold_token_amount
        .checked_add(actual_token_amount)
        .ok_or(PresaleError::Overflow)?;

    if new_sold_amount > presale_info.hardcap_amount {
        return Err(PresaleError::ExceedsHardcap.into());
    }

    if new_sold_amount > presale_info.deposit_token_amount {
        return Err(PresaleError::InsufficientTokens.into());
    }

    let total_cost = token_amount
        .checked_mul(presale_info.lamport_price_per_token)
        .ok_or(PresaleError::Overflow)?;

    if ctx.accounts.buyer.lamports() < total_cost {
        return Err(PresaleError::InsufficientFunds.into());
    }

    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.presale_vault.to_account_info(),
            },
        ),
        total_cost,
    )?;
    

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.presale_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.presale_authority.to_account_info(),
            },
            &[&[PRESALE_SEED, &[presale_info.presale_identifier], &[ctx.bumps.presale_authority]]],
        ),
        actual_token_amount,
    )?;

    presale_info.sold_token_amount = new_sold_amount;

    buyer_account.purchased_amount = new_purchase_amount;

    if new_sold_amount >= presale_info.softcap_amount && !presale_info.is_soft_capped {
        presale_info.is_soft_capped = true;
        msg!("Softcap reached!");
    }

    if new_sold_amount >= presale_info.hardcap_amount && !presale_info.is_hard_capped {
        presale_info.is_hard_capped = true;
        presale_info.is_live = false; // Automatically end presale when hardcap is reached
        msg!("Hardcap reached! Presale ended.");
    }

    emit!(PresaleEvent {
        presale_identifier: presale_info.presale_identifier,
        buyer: ctx.accounts.buyer.key(),
        amount: token_amount,
        timestamp: current_time,
    });

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
    pub buyer_token_account: Account<'info, token::TokenAccount>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = presale_authority,
        constraint = presale_token_account.amount >= token_amount @ PresaleError::InsufficientTokens
    )]
   pub presale_token_account: Account<'info, token::TokenAccount>,
    #[account(
        mut,
        seeds = [PRESALE_SEED, &[presale_info.presale_identifier]],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,
    /// CHECK: This is not dangerous
    #[account(        
        seeds = [PRESALE_SEED, &[presale_info.presale_identifier]],
        bump,  
    )]
    pub presale_authority: AccountInfo<'info>,
    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [PRESALE_VAULT, &[presale_info.presale_identifier]],
        bump,
    )]
    pub presale_vault: AccountInfo<'info>,
    #[account(mut)]    pub buyer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + 8,
        seeds = [b"BUYER_ACCOUNT", presale_info.presale_identifier.to_le_bytes().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub buyer_account: Account<'info, BuyerAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

#[event]
pub struct PresaleEvent {
    pub presale_identifier: u8,
    pub buyer: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}