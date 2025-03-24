import "dotenv/config"
import { clusterApiUrl } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { readFile } from "fs/promises";

const umi = createUmi(clusterApiUrl("devnet"));
const keypair = getKeypairFromEnvironment("Prv_key");
const umi_kp = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
const signer = createSignerFromKeypair(umi, umi_kp);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

const IMG_FILE = "./test.png";

async function uploadImg() {
    try {
        const img = await readFile(IMG_FILE);
        const imgConverted = createGenericFile(new Uint8Array(img), "image/png");

        const [myUri] = await umi.uploader.upload([imgConverted]);

        console.log(`Link ${myUri}`);
    }
    catch (err) {
        console.error("[uploadImg] failed with:", err);
    }
}

uploadImg();