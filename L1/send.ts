import "dotenv/config"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";


async function send() {
    const args = process.argv.slice(2);
    let ammout;
    let recipient;
    try {
        ammout = +args[0] * LAMPORTS_PER_SOL;
        recipient = new PublicKey(args[1]);
    }
    catch (error) {
        console.error("Wrong args");
    }

    const keypair = getKeypairFromEnvironment("Prv_key");
    const connection = new Connection(clusterApiUrl("devnet"));

    const balance = await connection.getBalance(keypair.publicKey);

    if (balance < ammout + 5000) {
        console.log("Not enough balance");
        return;
    }

    const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipient,
          lamports: ammout,
        })
      );
  
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [keypair],
        { commitment: "confirmed" }
      );

      console.log(`Transaction signature: ${signature}`);
}

send();