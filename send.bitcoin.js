const axios = require("axios");
const bitcore = require("bitcore-lib");

const TESTNET = true;

module.exports = async function sendBitcoin(receiverAddress, amountToSend) {
  try {
    const privateKey ="ceb461989ef225cab3457d8063a418294db12151cd8c6b554b687404b6fe467b";
    const sourceAddress = "mkN1csfky8jJULACdQb4yeNjP5Aw3XBihM";
    const satoshiToSend = amountToSend * 100000000;

    // Fetch recommended fee from external API
    const recommendedFeeResponse = await axios.get(
      "https://bitcoinfees.earn.com/api/v1/fees/recommended"
    );
    const feeRate = TESTNET ? 1 : recommendedFeeResponse.data.hourFee / 3; // satoshi per byte

    // Fetch UTXOs from the source address
    const utxosResponse = await axios.get(
      `https://blockstream.info/${TESTNET ? "testnet/" : ""}api/address/${sourceAddress}/utxo`
    );
    const utxos = utxosResponse.data;

    // Calculate total amount available in the source address
    const totalAmountAvailable = utxos.reduce(
      (total, utxo) => total + utxo.value,
      0
    );

    // Prepare inputs for the transaction
    const inputs = utxos.map((utxo) => ({
      satoshis: utxo.value,
      script: bitcore.Script.buildPublicKeyHashOut(sourceAddress).toHex(),
      address: sourceAddress,
      txId: utxo.txid,
      outputIndex: utxo.vout,
    }));

    // Calculate transaction size
    const inputCount = utxos.length;
    const outputCount = 2; // recipient + change
    const transactionSize =
      inputCount * 180 + outputCount * 34 + 10 - inputCount;

    // Calculate fee
    const fee = Math.round(transactionSize * feeRate);

    // Check if the balance is sufficient for the transaction
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
      throw new Error("Balance is too low for this transaction");
    }

    // Create a new Bitcoin transaction
    const transaction = new bitcore.Transaction()
      .from(inputs)
      .to(receiverAddress, satoshiToSend)
      .change(sourceAddress)
      .fee(fee)
      .sign(privateKey);

    // Serialize transaction
    const serializedTransaction = transaction.serialize();

    // Send transaction
    const result = await axios.post(
      `https://blockstream.info/${TESTNET ? "testnet/" : ""}api/tx`,
      serializedTransaction
    );

    // Log success
    console.log("Transaction successful:", result.data);

    return result.data;
  } catch (error) {
    // Log error
    console.error("Error:", error.message);

    // Return a custom error message or handle it as needed
    return { error: "An error occurred during the transaction." };
  }
};
