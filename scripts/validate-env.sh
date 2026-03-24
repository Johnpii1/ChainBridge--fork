#!/bin/bash
# =============================================================================
# Environment Configuration Validation Script
# =============================================================================
# This script validates that all required environment variables are set
# Usage: ./scripts/validate-env.sh [environment]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-development}

echo "=========================================="
echo "ChainBridge Environment Validation"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check required variable
check_required() {
    local var_name=$1
    local var_value=$2
    local description=$3
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}ERROR${NC}: $var_name is not set - $description"
        ERRORS=$((ERRORS + 1))
        return 1
    else
        echo -e "${GREEN}OK${NC}: $var_name is set"
        return 0
    fi
}

# Function to check optional variable with warning
check_optional() {
    local var_name=$1
    local var_value=$2
    local description=$3
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}WARN${NC}: $var_name is not set - $description"
        WARNINGS=$((WARNINGS + 1))
        return 1
    else
        echo -e "${GREEN}OK${NC}: $var_name is set"
        return 0
    fi
}

# Function to check variable matches pattern
check_pattern() {
    local var_name=$1
    local var_value=$2
    local pattern=$3
    local description=$4
    
    if [[ ! "$var_value" =~ $pattern ]]; then
        echo -e "${RED}ERROR${NC}: $var_name has invalid format - $description"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "=== Loading environment from .env file ==="
echo ""

# Load environment file if exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}WARN${NC}: No .env file found"
fi

# =============================================================================
# BACKEND VALIDATION
# =============================================================================
echo "=== Backend Configuration ==="
echo ""

if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

check_required "DATABASE_URL" "$DATABASE_URL" "Primary database connection string"
check_required "REDIS_URL" "$REDIS_URL" "Redis connection string"
check_optional "STELLAR_NETWORK" "$STELLAR_NETWORK" "Stellar network (testnet/mainnet)"
check_optional "SOROBAN_RPC_URL" "$SOROBAN_RPC_URL" "Soroban RPC endpoint"
check_optional "CHAINBRIDGE_CONTRACT_ID" "$CHAINBRIDGE_CONTRACT_ID" "ChainBridge contract address"
check_optional "SECRET_KEY" "$SECRET_KEY" "Application secret key"

if [ "$ENVIRONMENT" = "production" ]; then
    check_required "SECRET_KEY" "$SECRET_KEY" "Secret key required in production"
    if [ ${#SECRET_KEY} -lt 32 ]; then
        echo -e "${RED}ERROR${NC}: SECRET_KEY must be at least 32 characters in production"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# =============================================================================
# FRONTEND VALIDATION
# =============================================================================
echo "=== Frontend Configuration ==="
echo ""

if [ -f "frontend/.env.local" ]; then
    export $(cat frontend/.env.local | grep -v '^#' | xargs)
fi

check_required "NEXT_PUBLIC_API_URL" "$NEXT_PUBLIC_API_URL" "Backend API URL"
check_optional "NEXT_PUBLIC_STELLAR_NETWORK" "$NEXT_PUBLIC_STELLAR_NETWORK" "Stellar network"

echo ""

# =============================================================================
# RELAYER VALIDATION
# =============================================================================
echo "=== Relayer Configuration ==="
echo ""

if [ -f "relayer/.env" ]; then
    export $(cat relayer/.env | grep -v '^#' | xargs)
fi

check_optional "RELAYER_STELLAR_SECRET" "$RELAYER_STELLAR_SECRET" "Relayer Stellar secret (optional for read-only)"

echo ""

# =============================================================================
# DOCKER VALIDATION
# =============================================================================
echo "=== Docker Configuration ==="
echo ""

check_required "POSTGRES_USER" "$POSTGRES_USER" "PostgreSQL username"
check_required "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD" "PostgreSQL password"

if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$POSTGRES_PASSWORD" = "chainbridge_dev" ] || [ "$POSTGRES_PASSWORD" = "change_this_password_in_production" ]; then
        echo -e "${RED}ERROR${NC}: Default PostgreSQL password detected in production"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation FAILED${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Validation PASSED with warnings${NC}"
    exit 0
else
    echo -e "${GREEN}Validation PASSED${NC}"
    exit 0
fi
