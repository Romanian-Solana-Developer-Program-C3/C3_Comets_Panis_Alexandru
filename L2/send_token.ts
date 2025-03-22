import "dotenv/config"
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";
import { createTransferInstruction, getMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const MINT = new PublicKey("8NWetAV7U6iYQMx4Kmnhzpt67Jd9eivCMAgkX9L3V6Ji");

async function send() {
  const args = process.argv.slice(2);
  let amount;
  let recipient;
  try {
    amount = +args[0];

    recipient = new PublicKey(args[1]);
  }
  catch (error) {
    console.error("Wrong args");
  }

  const keypair = getKeypairFromEnvironment("Prv_key");
  const connection = new Connection(clusterApiUrl("devnet"));

  const mintInfo = await getMint(connection, MINT);

  //Update the amount
  amount *= 10 ** mintInfo.decimals;

  const senderAta = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    MINT,
    keypair.publicKey
  );

  const balance = await connection.getTokenAccountBalance(senderAta.address);

  if (balance < amount) {
    console.log("Not enough balance");
    return;
  }

  const recvAta = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    MINT,
    recipient
  );

  const transaction = new Transaction().add(
    createTransferInstruction(
      senderAta.address,
      recvAta.address,
      keypair.publicKey,
      amount
    )
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair],
    { commitment: "confirmed" }
  );

  const sigLink = getExplorerLink("transaction", signature, "devnet");
  console.log(`Transaction signature link: ${sigLink}`);
}

send();

