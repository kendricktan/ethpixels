# ethpixels
Buy pixels on my website using Eth

# Setup
1. Install testrpc & truffle
```
npm install -g ethereumjs-testrpc truffle
```

2. Install local dependencies
```
npm install
```

3. Run (locally) need to have testrpc running locally
```bash
testrpc  # In another terminal
truffle compile
truffle migrate
```

# Deploying to infura node (rinkeby supported atm)
1. Get API key from https://infura.io
2. Get seed phrase from metamask (settings -> reveal seed words)
2. Export the following to your environment variables
```
export INFURA_API_KEY="<infura-api-key>"
export ETH_MNEMONIC_KEY="<ethereum-mnemonic-phrase>"
```

4. `truffle compile && truffle migrate --network rinkeby`

# Deploying to local rinkeby

1. Make sure you have `geth` installed
```bash
mkdir ~/.rinkeby

wget https://www.rinkeby.io/rinkeby.json -O /tmp/rb.json

geth --datadir=$HOME/.rinkeby --light init /tmp/rb.json

geth --networkid=4 --datadir=$HOME/.rinkeby --syncmode=light --bootnodes=enode://a24ac7c5484ef4ed0c5eb2d36620ba4e4aa13b8c84684e1b4aab0cebea2ae45cb4d375b77eab56516d34bfbd3c1a833fc51296ff084b770b94fb9028c4d25ccf@52.169.42.101:30303?discport=30304 --rpc --rpcapi db,eth,net,web3,personal --rpcport 8545 --rpcaddr 127.0.0.1 --rpccorsdomain "*"
```

2. Wait for blockchain to sync then run
```bash
truffle compile
truffle migrate
```