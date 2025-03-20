import "dotenv/config"

import { airdropIfRequired, getKeypairFromEnvironment } from "@solana-developers/helpers"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const keypair = getKeypairFromEnvironment("Prv_key");
const connection = new Connection(clusterApiUrl("devnet"));

await airdropIfRequired(connection, keypair.publicKey, LAMPORTS_PER_SOL, LAMPORTS_PER_SOL)
.then(() => console.log("Got airdrop"))
.catch((reason) => console.log("Can't get airdrop", reason));

const balance = await connection.getBalance(keypair.publicKey);
console.log(`${keypair.publicKey.toBase58()} has ${balance}`);



