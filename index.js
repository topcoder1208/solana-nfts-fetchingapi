const express = require('express')
const { PublicKey, Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');
const axios = require('axios');
const {
    getParsedNftAccountsByOwner
} = require("@nfteyez/sol-rayz");
const { Program, Provider, Wallet } = require('@project-serum/anchor');

const programId = new PublicKey('DKN4Ezo2rV82o9dQ7ygr6fBC659rZTk37RB5KLo2ssKX');
const poolPubkey = new PublicKey('Gg6kEEyb5aJ5thqoyAtZDKk1WnE6oJQfmrRawb3pBmui');

const rawdata = fs.readFileSync('/root/.config/solana/id.json');
const keyData = JSON.parse(rawdata.toString());
const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(keyData));
const wallet = new Wallet(walletKeyPair);
const opts = {
    preflightCommitment: "processed"
}
// devnet, mainnet-beta, testnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = new Provider(
    connection, wallet, opts.preflightCommitment,
);

const idl = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'idl.json')));
const program = new Program(idl, programId, provider);

const getAllNfts = async (walletPubKey) => {
    try {
        const nfts = await getParsedNftAccountsByOwner({
            publicAddress: walletPubKey,
            connection: connection,
            serialization: true,
        });

        const poolObject = await program?.account.pool.fetch(poolPubkey);
        const candyMachines = poolObject?.candyMachines.map((candyMachine) => candyMachine.toBase58());
        const loginNfts = nfts.filter((nft) => candyMachines.indexOf(nft.data.creators[0].address) > -1);

        return loginNfts;
    } catch (error) {
        console.log(error);
    }
};
const getLoginNfts = async (publicKey) => {
    if (publicKey) {
        const loginNfts = await getAllNfts(publicKey) || [];

        let metadatas = [];
        for (const loginNft of loginNfts) {
            const metadata = await axios.get(loginNft.data.uri);
            metadatas.push(metadata);
        }

        return metadatas;
    }
}
app.get('/verify', async (req, res) => {
    const { pubkey } = req.query;
    const nfts = await getLoginNfts(new PublicKey(pubkey));
    res.json(nfts)
})