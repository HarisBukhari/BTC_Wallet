const bitcoin = require('bitcoinjs-lib-zcash');
const axios = require('axios');

const TESTNET = true;

async function sendBitcoin(receiverAddress, amountToSend, privateKey) {
  try {
    const satoshiToSend = Math.round(amountToSend * 1e8); // Convert BTC to satoshis

    // Derive the key pair from the private key
    const keyPair = bitcoin.ECPair.fromWIF(privateKey, TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);

    // Fetch UTXOs from the source address
    const sourceAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin }).address;
    const utxosResponse = await axios.get(`https://blockstream.info/${TESTNET ? 'testnet/' : ''}api/address/${sourceAddress}/utxo`);
    const utxos = utxosResponse.data;

    // Prepare inputs for the transaction
    const txb = new bitcoin.TransactionBuilder(TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
    
    utxos.forEach(utxo => {
      txb.addInput(utxo.txid, utxo.vout);
    });

    // Add output for the recipient
    txb.addOutput(receiverAddress, satoshiToSend);

    // Calculate change amount
    const totalAmountAvailable = utxos.reduce((total, utxo) => total + utxo.value, 0);
    const changeAmount = totalAmountAvailable - satoshiToSend;

    // Add output for change if there is any
    if (changeAmount > 0) {
      txb.addOutput(sourceAddress, changeAmount);
    }

    // Sign the transaction with private key
    utxos.forEach((utxo, index) => {
      txb.sign(index, keyPair);
    });

    // Build and serialize the transaction
    const rawTransaction = txb.build().toHex();

    // Broadcast the transaction
    const broadcastResponse = await axios.post(`https://blockstream.info/${TESTNET ? 'testnet/' : ''}api/tx`, rawTransaction);

    return broadcastResponse.data;
  } catch (error) {
    console.error('Error:', error.message);
    return { error: 'An error occurred during the transaction.' };
  }
}

// Example usage:
const receiverAddress = 'msWCNri3N7uNPEe42r6cKaYRDvc4SvoxnB'; // Replace with the recipient's Bitcoin address
const amountToSend = 0.001; // BTC
const privateKey = 'e4dbc6a75bd0d77b487d3f77060f1b21fd1964e36871be48b93fea364dccea6b'; // Replace with the sender's private key

sendBitcoin(receiverAddress, amountToSend, privateKey)
  .then(result => console.log(result))
  .catch(error => console.error(error));
