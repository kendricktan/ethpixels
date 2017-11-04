var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = process.env.INFURA_API_KEY;
var mnemonic = process.env.ETH_MNEMONIC_KEY;

module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4710000      
    },
    rinkeby: {
      network_id: 4,
      provider: new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/"+infura_apikey),
      gas: 4710000
    },
  }
};
