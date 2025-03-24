import "dotenv/config"
import { clusterApiUrl } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

const umi = createUmi(clusterApiUrl("devnet"));
const keypair = getKeypairFromEnvironment("Prv_key");
const umi_kp = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
const signer = createSignerFromKeypair(umi, umi_kp);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

const IMG_URI = "https://gateway.irys.xyz/CTCRKBSPh6VysdtgqPcJ5G5cW3xZgGpbNT9C68AXbFca";

async function uploadMetadata() {
    try {
        const metadata = {
            name: "Test1",
            symbol: "Test",
            description: "Test nft",
            image: IMG_URI,
            attributes: [
                {trait_type: "t1", value: "s1"},
                {trait_type: "t2", value: "s2"},
                {trait_type: "t3", value: "s3"},
            ],
            properties: {
                files: [{type: "image/png", uri: IMG_URI}]
            }
        }

        const metadataUri = await umi.uploader.uploadJson(metadata);
        console.log(`Metadata: ${metadataUri}`);
    }
    catch (err) {
        console.error("[uploadMetadata] failed with:", err);
    }
}

uploadMetadata();