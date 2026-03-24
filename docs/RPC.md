# RPC Endpoints Configuration

## Overview

This document provides example RPC endpoint configurations for all supported blockchains. These endpoints are used by the relayer, backend, and frontend to interact with various blockchain networks.

## Stellar / Soroban

### Testnet

| Service | URL | Provider |
|---------|-----|----------|
| Soroban RPC | `https://soroban-testnet.stellar.org` | Stellar Foundation |
| Horizon | `https://horizon-testnet.stellar.org` | Stellar Foundation |
| Friendbot | `https://friendbot.stellar.org` | Stellar Foundation |

### Mainnet

| Service | URL | Provider |
|---------|-----|----------|
| Soroban RPC | `https://soroban-mainnet.stellar.org` | Stellar Foundation |
| Horizon | `https://horizon-mainnet.stellar.org` | Stellar Foundation |

### Example Configuration

```bash
# Testnet
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org

# Mainnet
STELLAR_NETWORK=mainnet
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
HORIZON_URL=https://horizon-mainnet.stellar.org
```

### Public RPC Providers

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Stellar Foundation | Yes | Default, rate limited |
| [QuickNode](https://quicknode.com) | Yes | Requires account |
| [Tatum](https://tatum.io) | Yes | Has API limits |

---

## Bitcoin

### Testnet

| Service | URL | Default Port |
|---------|-----|--------------|
| RPC | `http://localhost:8332` | 8332 |
| ZMQ | `tcp://localhost:8333` | 8333 |

### Mainnet

| Service | URL | Default Port |
|---------|-----|--------------|
| RPC | `http://localhost:8332` | 8332 |
| ZMQ | `tcp://localhost:8333` | 8333 |

### Example Configuration

```bash
# Testnet
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USER=bitcoin
BITCOIN_RPC_PASSWORD=your_password

# Mainnet
BITCOIN_NETWORK=mainnet
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USER=bitcoin
BITCOIN_RPC_PASSWORD=your_password
```

### Public RPC Providers

| Provider | Network | Free Tier | Notes |
|----------|---------|-----------|-------|
| [Blockstream](https://blockstream.info) | Mainnet | Yes | Electrum only |
| [Blockstream](https://blockstream.info/testnet) | Testnet | Yes | Electrum only |
| [BitcoinNode](https://bitcoinnode.io) | Mainnet | Yes | Requires signup |
| [QnB](https://qnb.io) | Mainnet | Yes | Limited requests |

### Running Local Bitcoin Node

```bash
# Start Bitcoin Core in testnet mode
bitcoind -testnet -server -rpcuser=bitcoin -rpcpassword=bitcoin_password

# Or for mainnet
bitcoind -server -rpcuser=bitcoin -rpcpassword=bitcoin_password
```

---

## Ethereum

### Testnets

| Network | RPC URL | WebSocket URL |
|---------|---------|---------------|
| Sepolia | `https://sepolia.infura.io/v3/YOUR_KEY` | `wss://sepolia.infura.io/v3/YOUR_KEY` |
| Goerli | `https://goerli.infura.io/v3/YOUR_KEY` | `wss://goerli.infura.io/v3/YOUR_KEY` |

### Mainnet

| Network | RPC URL | WebSocket URL |
|---------|---------|---------------|
| Ethereum | `https://mainnet.infura.io/v3/YOUR_KEY` | `wss://mainnet.infura.io/v3/YOUR_KEY` |

### Example Configuration

```bash
# Testnet (Sepolia)
ETHEREUM_NETWORK=testnet
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_RPC_WS_URL=wss://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Mainnet
ETHEREUM_NETWORK=mainnet
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_RPC_WS_URL=wss://mainnet.infura.io/v3/YOUR_INFURA_KEY
```

### Public RPC Providers

| Provider | Networks | Free Tier | Notes |
|----------|----------|-----------|-------|
| [Infura](https://infura.io) | Mainnet, Testnets | 100K/day | Most popular |
| [Alchemy](https://alchemy.com) | Mainnet, Testnets | 10M compute units | Generous free tier |
| [QuickNode](https://quicknode.com) | Mainnet, Testnets | Yes | Fast nodes |
| [Cloudflare](https://cloudflare-eth.com) | Mainnet | Yes | Ethereum only |

### Getting Started with Infura

1. Create account at [infura.io](https://infura.io)
2. Create new project
3. Copy project ID
4. Use endpoint: `https://<NETWORK>.infura.io/v3/YOUR_PROJECT_ID`

---

## Solana

### Testnet

| Service | URL |
|---------|-----|
| RPC | `https://api.testnet.solana.com` |
| WebSocket | `wss://api.testnet.solana.com` |

### Mainnet

| Service | URL |
|---------|-----|
| RPC | `https://api.mainnet-beta.solana.com` |
| WebSocket | `wss://api.mainnet-beta.solana.com` |

### Example Configuration

```bash
# Testnet
SOLANA_NETWORK=testnet
SOLANA_RPC_URL=https://api.testnet.solana.com

# Mainnet
SOLANA_NETWORK=mainnet
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Public RPC Providers

| Provider | Network | Free Tier | Notes |
|----------|---------|-----------|-------|
| [Solana Foundation](https://docs.solana.com/rpc) | Testnet, Mainnet | Yes | Rate limited |
| [QuickNode](https://quicknode.com) | Mainnet, Testnets | Yes | Fast |
| [Alchemy](https://alchemy.com) | Mainnet, Testnets | Yes | Good free tier |

---

## Polygon

### Testnet (Amoy)

| Service | URL |
|---------|-----|
| RPC | `https://rpc-amoy.polygon.technology` |
| WebSocket | `wss://ws-amoy.polygon.technology` |

### Mainnet

| Service | URL |
|---------|-----|
| RPC | `https://polygon-rpc.com` |
| WebSocket | `wss://polygon-rpc.com` |

### Example Configuration

```bash
# Testnet
POLYGON_NETWORK=testnet
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology

# Mainnet
POLYGON_NETWORK=mainnet
POLYGON_RPC_URL=https://polygon-rpc.com
```

---

## Configuration Templates

### Development (Local)

```bash
# Local development with Docker
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
BITCOIN_RPC_URL=http://bitcoin:8332
ETHEREUM_RPC_URL=http://ethereum:8545
```

### Staging

```bash
# Staging environment
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
BITCOIN_RPC_URL=http://bitcoin-testnet:8332
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### Production

```bash
# Production environment
STELLAR_NETWORK=mainnet
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
BITCOIN_RPC_URL=http://bitcoin-mainnet:8332
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
```

## Rate Limits

### Typical Free Tier Limits

| Provider | Requests/Day | Notes |
|----------|--------------|-------|
| Stellar | 100/sec | Burst allowed |
| Infura | 100K/day | Project based |
| Alchemy | 10M CU | Compute units |
| QuickNode | Varies | Plan based |

### Handling Rate Limits

1. **Implement exponential backoff**
2. **Cache responses** where possible
3. **Use multiple providers** for redundancy
4. **Upgrade to paid tier** for production

## Network Confirmation Requirements

| Chain | Confirmations (Testnet) | Confirmations (Mainnet) |
|-------|------------------------|------------------------|
| Stellar | 1 ledger | 1 ledger |
| Bitcoin | 1 block | 6 blocks |
| Ethereum | 1 block | 12-15 blocks |
| Solana | 1 block | 1 block |
| Polygon | 1 block | 12 blocks |

## Troubleshooting

### Connection Timeout

- Check network connectivity
- Verify firewall rules
- Try alternative provider

### Invalid JSON Response

- Provider may be experiencing issues
- Check API key validity
- Verify request format

### Authentication Errors

- Verify API key is correct
- Check API key has required permissions
- Ensure project is active
