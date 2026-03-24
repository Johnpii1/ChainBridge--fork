# Secrets Management Guide

## Overview

This document outlines best practices for managing secrets and environment configuration in ChainBridge. Proper secrets management is critical for security, especially in production environments.

## Principles

### 1. Never Commit Secrets

- Never commit `.env` files to version control
- Add `.env` to `.gitignore`
- Use `.env.example` for templates

### 2. Use Strong Secrets

- Generate cryptographically secure random values
- Minimum 32 characters for API keys
- Use unique passwords for each environment

### 3. Environment Isolation

- Separate configurations for development, staging, and production
- Never use production secrets in development

## Secret Types

### Database Credentials

| Secret | Description | Generation |
|--------|-------------|------------|
| `POSTGRES_PASSWORD` | PostgreSQL database password | 32+ random characters |
| `REDIS_PASSWORD` | Redis cache password | 32+ random characters |
| `DATABASE_URL` | Full database connection string | Construct from above |

### Application Secrets

| Secret | Description | Generation |
|--------|-------------|------------|
| `SECRET_KEY` | Application secret for sessions | 64+ random characters |
| `JWT_SECRET_KEY` | JWT token signing key | 64+ random characters |

### Blockchain Secrets

| Secret | Description | Generation |
|--------|-------------|------------|
| `STELLAR_ADMIN_SECRET` | Admin account secret (base32) | Stellar keypair |
| `RELAYER_STELLAR_SECRET` | Relayer account secret | Stellar keypair |
| `ETHEREUM_PRIVATE_KEY` | Ethereum wallet private key | Ethereum keypair |
| `BITCOIN_PRIVATE_KEY` | Bitcoin wallet private key | Bitcoin keypair |

### External Service Secrets

| Secret | Description | Generation |
|--------|-------------|------------|
| `ETHEREUM_RPC_URL` | Ethereum node URL | Infura/Alchemy account |
| `ETHEREUM_RPC_WS_URL` | Ethereum WebSocket URL | Infura/Alchemy account |
| `SMTP_PASSWORD` | Email service password | From email provider |

## Generating Secrets

### Using openssl

```bash
# Generate random 32-character key
openssl rand -base64 32

# Generate random hex key
openssl rand -hex 32
```

### Using Python

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Using Stellar CLI

```bash
stellar keys generate --global chainbridge-admin
stellar keys show chainbridge-admin
```

## Environment-Specific Configuration

### Development

```bash
# .env.local (not committed)
DEBUG=true
STELLAR_NETWORK=testnet
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/chainbridge
```

### Staging

```bash
# staging.env (stored in secrets manager)
DEBUG=false
STELLAR_NETWORK=testnet
DATABASE_URL=<staging_database_url>
```

### Production

```bash
# production.env (stored in secrets manager)
DEBUG=false
STELLAR_NETWORK=mainnet
DATABASE_URL=<production_database_url>
SECRET_KEY=<strong_random_key>
```

## Secrets Management Solutions

### Option 1: Docker Secrets (Swarm)

```yaml
# docker-compose.yml
services:
  backend:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### Option 2: Kubernetes Secrets

```yaml
# kubernetes/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: chainbridge-secrets
type: Opaque
data:
  # Base64 encoded
  DATABASE_URL: cG9zdGdyZXNxbC4uLg==
  SECRET_KEY: c2VjcmV0X2tleS4uLg==
```

### Option 3: Cloud Provider Secrets Manager

#### AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name chainbridge/production \
  --secret-string '{"DATABASE_URL":"...","SECRET_KEY":"..."}'

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id chainbridge/production \
  --query SecretString
```

#### Google Cloud Secret Manager

```bash
# Store secret
echo -n "secret_value" | gcloud secrets create VERSION --replication-policy=automatic

# Access in application
gcloud secrets versions access latest --secret=CHAINBRIDGE_SECRET
```

### Option 4: HashiCorp Vault

```bash
# Store secret
vault kv put chainbridge/database url="postgresql://..."

# Access in application
export DATABASE_URL=$(vault kv get -field=url chainbridge/database)
```

## CI/CD Pipeline Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - name: Fetch secrets
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
        run: |
          echo "DATABASE_URL=$DATABASE_URL" >> $GITHUB_ENV
```

### Injecting Secrets as Files

```bash
# Create secret file from environment variable
echo -n "$SECRET_KEY" > secret_file.txt

# Mount as volume in container
# docker-compose.yml
volumes:
  - ./secret_file.txt:/run/secrets/secret_key:ro
```

## Best Practices Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] All secrets are at least 32 characters
- [ ] Production uses unique secrets from development
- [ ] Secrets are rotated regularly (90 days recommended)
- [ ] Database uses strong passwords
- [ ] API keys have minimal required permissions
- [ ] Private keys are stored in secure secret managers
- [ ] No hardcoded secrets in source code
- [ ] Logs don't contain sensitive information
- [ ] Environment variables are validated on startup

## Troubleshooting

### Secret Not Found

If you see errors like `Environment variable not set`:

1. Check the `.env` file exists in the correct directory
2. Verify the variable name matches (case-sensitive)
3. Restart the application after adding new secrets
4. Check for typos in variable names

### Invalid Secret Format

If you see errors about invalid secrets:

1. Check for extra whitespace or newlines
2. Ensure proper encoding (UTF-8)
3. Verify URL-encoded characters are decoded

### Permission Denied

If you see permission errors:

1. Check file permissions on secret files
2. Ensure Docker volumes are mounted correctly
3. Verify Kubernetes service account has secret access

## Security Incident Response

If you suspect secrets have been compromised:

1. **Immediately rotate** all potentially compromised secrets
2. **Review access logs** to identify unauthorized access
3. **Enable additional monitoring** on affected systems
4. **Notify** relevant stakeholders
5. **Update documentation** with lessons learned
