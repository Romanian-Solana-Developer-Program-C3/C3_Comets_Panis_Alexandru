use std::str::FromStr;

use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        native_token::LAMPORTS_PER_SOL,
        program_pack::Pack,
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair, Signer},
        system_instruction, system_program,
        transaction::Transaction,
    },
    Client, Cluster,
};
use anchor_spl::associated_token::ID as ASSOCIATED_TOKEN_PROGRAM_ID;
use anchor_spl::{
    associated_token::spl_associated_token_account,
    token::{spl_token, ID as TOKEN_PROGRAM_ID},
};
use spl_token::state::Mint;

#[test]
fn test_escrow() {
    // Initialize the client
    let program_id = "BvbGw8FFGYasyFaVo6ryAspTNyux1w2kXeJjccHo2UF4";
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap();
    let payer = read_keypair_file(&anchor_wallet).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, &payer, CommitmentConfig::confirmed());
    let program_id = Pubkey::from_str(program_id).unwrap();
    let program = client.program(program_id).unwrap();

    let maker = Keypair::new();
    let taker = Keypair::new();

    //Airdrop SOL to the maker and taker
    program
        .request()
        .instruction(system_instruction::transfer(
            &payer.pubkey(),
            &maker.pubkey(),
            LAMPORTS_PER_SOL,
        ))
        .send()
        .expect("Failed to airdrop SOL to the maker");

    program
        .request()
        .instruction(system_instruction::transfer(
            &payer.pubkey(),
            &taker.pubkey(),
            LAMPORTS_PER_SOL,
        ))
        .send()
        .expect("Failed to airdrop SOL to the taker");

    // // Create token mints
    let token_mint_a = Keypair::new();
    let token_mint_b = Keypair::new();

    let mint_space = Mint::LEN as u64;
    let mint_rent = program
        .rpc()
        .get_minimum_balance_for_rent_exemption(mint_space as usize)
        .unwrap();

    program
        .request()
        .instruction(system_instruction::create_account(
            &payer.pubkey(),
            &token_mint_a.pubkey(),
            mint_rent,
            mint_space,
            &TOKEN_PROGRAM_ID,
        ))
        .instruction(
            spl_token::instruction::initialize_mint(
                &TOKEN_PROGRAM_ID,
                &token_mint_a.pubkey(),
                &payer.pubkey(),
                Some(&payer.pubkey()),
                9,
            )
            .unwrap(),
        )
        .signer(&token_mint_a)
        .send()
        .expect("Failed to create token mint A");

    program
        .request()
        .instruction(system_instruction::create_account(
            &payer.pubkey(),
            &token_mint_b.pubkey(),
            mint_rent,
            mint_space,
            &TOKEN_PROGRAM_ID,
        ))
        .instruction(
            spl_token::instruction::initialize_mint(
                &TOKEN_PROGRAM_ID,
                &token_mint_b.pubkey(),
                &payer.pubkey(),
                Some(&payer.pubkey()),
                9,
            )
            .unwrap(),
        )
        .signer(&token_mint_b)
        .send()
        .expect("Failed to create token mint B");

    // Create associated token accounts
    let maker_token_a = spl_associated_token_account::get_associated_token_address(
        &maker.pubkey(),
        &token_mint_a.pubkey(),
    );
    let maker_token_b = spl_associated_token_account::get_associated_token_address(
        &maker.pubkey(),
        &token_mint_b.pubkey(),
    );
    let taker_token_a = spl_associated_token_account::get_associated_token_address(
        &taker.pubkey(),
        &token_mint_a.pubkey(),
    );
    let taker_token_b = spl_associated_token_account::get_associated_token_address(
        &taker.pubkey(),
        &token_mint_b.pubkey(),
    );

    // Create ATAs
    // Mint token A to the maker
    program
        .request()
        .instruction(
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &maker.pubkey(),
                &token_mint_a.pubkey(),
                &TOKEN_PROGRAM_ID,
            ),
        )
        .instruction(
            spl_token::instruction::mint_to(
                &TOKEN_PROGRAM_ID,
                &token_mint_a.pubkey(),
                &maker_token_a,
                &payer.pubkey(),
                &[&payer.pubkey()],
                1_000_000,
            )
            .unwrap(),
        )
        .send()
        .expect("Failed to create maker token A account");

    //Mint token B to the taker
    program
        .request()
        .instruction(
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &taker.pubkey(),
                &token_mint_b.pubkey(),
                &TOKEN_PROGRAM_ID,
            ),
        )
        .instruction(
            spl_token::instruction::mint_to(
                &TOKEN_PROGRAM_ID,
                &token_mint_b.pubkey(),
                &taker_token_b,
                &payer.pubkey(),
                &[&payer.pubkey()],
                1_000_000,
            )
            .unwrap(),
        )
        .send()
        .expect("Failed to create taker token B account");

    // Calculate PDAs
    let offer_id = 1234u64;
    let maker_pubkey = &maker.pubkey();
    let seeds = &[b"offer", maker_pubkey.as_ref(), &offer_id.to_le_bytes()];
    let (offer_pda, _) = Pubkey::find_program_address(seeds, &program_id);

    let vault = spl_associated_token_account::get_associated_token_address(
        &offer_pda,
        &token_mint_a.pubkey(),
    );

    // Make offer
    program
        .request()
        .accounts(escrow::accounts::MakeOffer {
            maker: maker.pubkey(),
            token_mint_a: token_mint_a.pubkey(),
            token_mint_b: token_mint_b.pubkey(),
            maker_token_account_a: maker_token_a,
            offer: offer_pda,
            vault,
            token_program: TOKEN_PROGRAM_ID,
            associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .args(escrow::instruction::MakeOffer {
            id: offer_id,
            token_a_amount: 100,
            token_b_amount: 200,
        })
        .signer(&maker)
        .send()
        .expect("Failed to make offer");

    // Verify offer
    let offer_account = program
        .account::<escrow::Offer>(offer_pda)
        .expect("Failed to fetch offer account");

    assert_eq!(offer_account.token_a_amount, 100);
    assert_eq!(offer_account.token_b_amount, 200);


    // Take offer
    program
        .request()
        .accounts(escrow::accounts::TakeOffer {
            taker: taker.pubkey(),
            maker: maker.pubkey(),
            token_mint_a: token_mint_a.pubkey(),
            token_mint_b: token_mint_b.pubkey(),
            taker_token_account_a: taker_token_a,
            taker_token_account_b: taker_token_b,
            maker_token_account_b: maker_token_b,
            vault,
            offer: offer_pda,
            token_program: TOKEN_PROGRAM_ID,
            associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .args(escrow::instruction::TakeOffer {})
        .signer(&taker)
        .send()
        .expect("Failed to take offer");

    // Verify final token balances
    let maker_token_b_balance = program
        .rpc()
        .get_token_account_balance(&maker_token_b)
        .expect("Failed to get maker token B balance")
        .amount
        .parse::<u64>()
        .unwrap();

    let taker_token_a_balance = program
        .rpc()
        .get_token_account_balance(&taker_token_a)
        .expect("Failed to get taker token A balance")
        .amount
        .parse::<u64>()
        .unwrap();

    assert_eq!(maker_token_b_balance, 200, "Maker should have received 200 token B");
    assert_eq!(taker_token_a_balance, 100, "Taker should have received 100 token A");
}
