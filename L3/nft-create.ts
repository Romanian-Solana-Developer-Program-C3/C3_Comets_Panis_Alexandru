import "dotenv/config"
import { clusterApiUrl } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, generateSigner, percentAmount, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { sign } from "crypto";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(clusterApiUrl("devnet"));
const keypair = getKeypairFromEnvironment("Prv_key");
const umi_kp = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
const signer = createSignerFromKeypair(umi, umi_kp);

umi.use(mplTokenMetadata());
umi.use(signerIdentity(signer));

const IMG_URI = "https://gateway.irys.xyz/CTCRKBSPh6VysdtgqPcJ5G5cW3xZgGpbNT9C68AXbFca";
const METADATA_URI =  "https://devnet.irys.xyz/7QZ9tMKRbLY5cpdwAAVnuXZQRVb3N1k4XJKqZi1sMr6a";

async function createMyNFT() {
    const mint = generateSigner(umi);
    try {

        const tx = await createNft(umi, {
            name: "Test1",
            symbol: "Test",
            mint: mint,
            sellerFeeBasisPoints: percentAmount(5),
            uri: METADATA_URI,
            authority: signer,
            isCollection: false
          }).sendAndConfirm(umi);

        console.log(base58.deserialize(tx.signature));
    }
    catch (err) {
        console.error("[createNFT] failed with:", err);
    }
}

createMyNFT();