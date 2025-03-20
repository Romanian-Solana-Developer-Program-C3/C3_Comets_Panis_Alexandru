import {Keypair} from "@solana/web3.js"

const keypair = Keypair.generate();

console.log(`Pub_key: ${keypair.publicKey.toBase58()}`)
console.log(`Prv_key: [${keypair.secretKey}]`)