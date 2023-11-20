const { testnet, mainnet } = require("bitcore-lib/lib/networks");
const { createWallet, createHDWallet } = require("./wallet.bitcoin");
const sendBitcoin = require("./send.bitcoin");

sendBitcoin("miNLWkKvTYmHbMLbuSt5JfnPg8WWzE5A6N", 0.0001)
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });

// console.log(createHDWallet(testnet))
// console.log(createWallet(testnet))