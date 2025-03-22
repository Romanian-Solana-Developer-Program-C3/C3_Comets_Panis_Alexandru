import "dotenv/config"
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";
import { getOrCreateAssociatedTokenAccount, mintTo, getMint } from "@solana/spl-token";


async function mint() {
    const args = process.argv.slice(2);
    let mint;
    let amount;
    try {
        mint = new PublicKey(args[0]);
        amount = +args[1];
    }
    catch (error) {
        console.error("Wrong args");
    }

    const keypair = getKeypairFromEnvironment("Prv_key");
    const connection = new Connection(clusterApiUrl("devnet"));

    const mintInfo = await getMint(connection, mint);

    //Update the amount
    amount *= 10 ** mintInfo.decimals;
    
    const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey
    )

    const ataLink = getExplorerLink("address", ata.address.toString(), "devnet");
    console.log(`Ata: ${ataLink}`);

    const mintTx = await mintTo(
        connection,
        keypair,
        mint,
        ata.address,
        keypair.publicKey,
        amount
    )
    const mintLink = getExplorerLink("tx", mintTx, "devnet")
    console.log("Tx: " + mintLink);
}

mint();