import "dotenv/config"

import { getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

async function createTokenMint()
{
    const keypair = getKeypairFromEnvironment("Prv_key");
    const connection = new Connection(clusterApiUrl("devnet"));
    
    const mint = await createMint(connection, keypair, keypair.publicKey, null, 9);
    
    const link = getExplorerLink("address", mint.toBase58(),"devnet");
    
    console.log(`Token ${mint} on: ${link}`);
}

createTokenMint();

