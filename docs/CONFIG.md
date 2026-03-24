# ChainBridge Configuration Guide

## Overview

ChainBridge uses environment variables for configuration across all its components. This guide provides a comprehensive overview of all configuration options.

## Directory Structure

```
ChainBridge/
├── .env.example                    # Root configuration (Docker)
├── backend/
│   ├── .env.example               # Backend configuration
│   └── app/
├── frontend/
│   ├── .env.example              # Frontend configuration
│   └── .env.local                # Local overrides (not committed)
├── relayer/
│   └── .env.example              # Relayer configuration
├── scripts/
│   └── validate-env.sh           # Configuration validation
└── docs/
    ├── CONFIG.md                 # This file
    ├── RPC.md                   # RPC endpoints
    └── SECRETS.md               # Secrets management
```

## Quick Start

### 1. Copy Example Files

```bash
# Root environment
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local

# Relayer
cp relayer/.env.example relayer/.env
```

### 2. Validate Configuration

```bash
./scripts/validate-env.sh
```

### 3. Start Services

```bash
# Using Docker Compose
docker-compose up -d

# Or with development mode
docker-compose -f docker-compose.dev.yml up -d
```

## Configuration by Component

### Root Configuration (.env)

Used by Docker Compose for container orchestration.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COMPOSE_PROJECT_NAME` | No | chainbridge | Docker Compose project name |
| `POSTGRES_USER` | Yes | chainbridge | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | - | PostgreSQL password |
| `POSTGRES_DB` | Yes | chainbridge | Database name |
| `POSTGRES_PORT` | No | 5432 | PostgreSQL port |
| `REDIS_PASSWORD` | Yes | - | Redis password |
| `REDIS_PORT` | No | 6379 | Redis port |
| `BACKEND_PORT` | No | 8000 | Backend HTTP port |
| `DEBUG` | No | false | Enable debug mode |
| `CORS_ORIGINS` | No | http://localhost:3000 | Allowed CORS origins |
| `STELLAR_NETWORK` | No | testnet | Stellar network |
| `ETHEREUM_NETWORK` | No | testnet | Ethereum network |
| `BITCOIN_NETWORK` | No | testnet | Bitcoin network |

### Backend Configuration (backend/.env)

Used by the FastAPI application.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **Application** |
| `APP_NAME` | No | ChainBridge | Application name |
| `DEBUG` | No | false | Debug mode |
| `LOG_LEVEL` | No | info | Logging level |
| `ENVIRONMENT` | No | development | Environment name |
| **Server** |
| `PORT` | No | 8000 | HTTP server port |
| `HOST` | No | 0.0.0.0 | Server host |
| **Database** |
| `DATABASE_URL` | Yes | - | Async database URL |
| `DATABASE_SYNC_URL` | No | DATABASE_URL | Sync database URL |
| `DATABASE_POOL_SIZE` | No | 10 | Connection pool size |
| **Redis** |
| `REDIS_URL` | Yes | - | Redis connection URL |
| `REDIS_MAX_CONNECTIONS` | No | 50 | Max connections |
| **Stellar** |
| `STELLAR_NETWORK` | No | testnet | Network name |
| `SOROBAN_RPC_URL` | No | - | Soroban RPC URL |
| `HORIZON_URL` | No | - | Horizon URL |
| `CHAINBRIDGE_CONTRACT_ID` | No | - | Contract address |
| `STELLAR_ADMIN_SECRET` | No | - | Admin secret key |
| **Bitcoin** |
| `BITCOIN_NETWORK` | No | testnet | Network name |
| `BITCOIN_RPC_URL` | No | - | Bitcoin RPC URL |
| `BITCOIN_RPC_USER` | No | - | RPC username |
| `BITCOIN_RPC_PASSWORD` | No | - | RPC password |
| **Ethereum** |
| `ETHEREUM_NETWORK` | No | testnet | Network name |
| `ETHEREUM_RPC_URL` | No | - | Ethereum RPC URL |
| **Security** |
| `SECRET_KEY` | No | - | Application secret |
| `JWT_SECRET_KEY` | No | - | JWT signing key |
| `RATE_LIMIT_ENABLED` | No | true | Enable rate limiting |
| `RATE_LIMIT_REQUESTS` | No | 100 | Requests per window |
| **Monitoring** |
| `METRICS_ENABLED` | No | true | Enable metrics |
| `METRICS_PORT` | No | 9090 | Metrics port |

### Frontend Configuration (frontend/.env.local)

Used by Next.js application.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **API** |
| `NEXT_PUBLIC_API_URL` | Yes | http://localhost:8000 | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | No | ws://localhost:8000/ws | WebSocket URL |
| **Networks** |
| `NEXT_PUBLIC_STELLAR_NETWORK` | No | testnet | Stellar network |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | No | - | Soroban RPC |
| `NEXT_PUBLIC_HORIZON_URL` | No | - | Horizon URL |
| `NEXT_PUBLIC_BITCOIN_NETWORK` | No | testnet | Bitcoin network |
| `NEXT_PUBLIC_ETHEREUM_NETWORK` | No | testnet | Ethereum network |
| `NEXT_PUBLIC_ETHEREUM_RPC_URL` | No | - | Ethereum RPC |
| **Contract** |
| `NEXT_PUBLIC_CHAINBRIDGE_CONTRACT_ID` | No | - | Contract address |
| **App** |
| `NEXT_PUBLIC_APP_NAME` | No | ChainBridge | App name |
| `NEXT_PUBLIC_DEBUG` | No | false | Debug mode |

### Relayer Configuration (relayer/.env)

Used by the relayer service.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **Relayer** |
| `RELAYER_NAME` | No | relayer-01 | Relayer identifier |
| `RELAYER_FEE_BPS` | No | 10 | Fee in basis points |
| `RELAYER_MAX_CONCURRENT_SWAPS` | No | 10 | Max concurrent swaps |
| **Logging** |
| `LOG_LEVEL` | No | info | Log level |
| `RUST_LOG` | No | info | Rust log level |
| **Database** |
| `DATABASE_URL` | Yes | - | PostgreSQL URL |
| **Redis** |
| `REDIS_URL` | Yes | - | Redis URL |
| **Stellar** |
| `STELLAR_NETWORK` | No | testnet | Network name |
| `SOROBAN_RPC_URL` | No | - | Soroban RPC |
| `CHAINBRIDGE_CONTRACT_ID` | No | - | Contract ID |
| `RELAYER_STELLAR_SECRET` | No | - | Relayer secret |
| **Bitcoin** |
| `BITCOIN_NETWORK` | No | testnet | Network name |
| `BITCOIN_RPC_URL` | No | - | Bitcoin RPC |
| `BITCOIN_RPC_USER` | No | - | RPC username |
| `BITCOIN_RPC_PASSWORD` | No | - | RPC password |
| **Ethereum** |
| `ETHEREUM_NETWORK` | No | testnet | Network name |
| `ETHEREUM_RPC_URL` | No | - | Ethereum RPC |
| `ETHEREUM_PRIVATE_KEY` | No | - | Private key |

## Network Configuration

### Testnet

```bash
# All components
STELLAR_NETWORK=testnet
ETHEREUM_NETWORK=testnet
BITCOIN_NETWORK=testnet

# Specific endpoints
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### Mainnet

```bash
# All components
STELLAR_NETWORK=mainnet
ETHEREUM_NETWORK=mainnet
BITCOIN_NETWORK=mainnet

# Specific endpoints
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
```

## Validation

Run the validation script to check your configuration:

```bash
# Validate all environments
./scripts/validate-env.sh

# Validate with specific environment
./scripts/validate-env.sh production
```

The script checks:
- Required variables are set
- Variables have valid formats
- Production has secure passwords
- Configuration consistency

## Docker Compose Integration

Environment variables are passed to containers via `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - DEBUG=${DEBUG:-false}
```

For development, you can override in `.env`:

```bash
# .env
DEBUG=true
STELLAR_NETWORK=testnet
```

## Troubleshooting

### Variable Not Found

1. Check the correct `.env` file exists
2. Verify variable name (case-sensitive)
3. Restart application after changes

### Connection Refused

1. Verify service is running
2. Check port numbers match
3. Ensure network connectivity

### Invalid Format

1. Check for extra whitespace
2. Verify URL encoding
3. Ensure proper quoting in shell

## Best Practices

1. **Use `.env.example` as template**
   - Never edit example files directly
   - Copy to `.env` and customize

2. **Separate environments**
   - Different `.env` for dev/staging/prod
   - Use secrets managers for production

3. **Validate on startup**
   - Run validation script before starting
   - Add checks to CI/CD pipeline

4. **Keep secrets secure**
   - Never commit `.env` to git
   - Use secrets managers in production
   - Rotate secrets regularly

5. **Document changes**
   - Update `.env.example` when adding variables
   - Update this guide

## Examples

### Minimal Development Setup

```bash
# .env
POSTGRES_PASSWORD=dev_password
REDIS_PASSWORD=dev_password
DEBUG=true

# backend/.env
DATABASE_URL=postgresql+asyncpg://chainbridge:dev_password@localhost:5432/chainbridge
REDIS_URL=redis://:dev_password@localhost:6379/0

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production Setup

```bash
# .env (stored in secrets manager)
POSTGRES_PASSWORD=<strong_password>
REDIS_PASSWORD=<strong_password>
DEBUG=false
STELLAR_NETWORK=mainnet
```

See [Secrets Management](./SECRETS.md) for production secrets handling.
