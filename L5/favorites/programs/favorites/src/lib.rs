
use anchor_lang::prelude::*;

declare_id!("GQ9uRZysjfib4cNKAqPUQAo99c37RTNaumR9uWkH5nRE");
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod favorites {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn set_favorites(
        ctx: Context<SetFavorites>,
        color: String,
        number: u64,
        hobbies: Vec<String>,
    ) -> Result<()> {
        
        msg!("Setting favorites");
        msg!("Program: {}", ctx.program_id);
        msg!("Setting {}'s favorite number {} and color {}", ctx.accounts.user.key(), number, color);
        msg!("Hobbies: {:?}", hobbies);

        let favorites = &mut ctx.accounts.favorites;
        favorites.color = color;
        favorites.number = number;
        favorites.hobbies = hobbies;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()],
        bump
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Favorites {
    #[max_len(32)]
    pub color: String,
    pub number: u64,
    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}