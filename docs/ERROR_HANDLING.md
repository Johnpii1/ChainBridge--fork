# Error Handling Patterns and Guidelines

## Overview

This document describes the error handling patterns used in ChainBridge smart contracts and provides guidelines for handling errors in client applications.

## Error Enum

All errors are defined in `smartcontract/src/error.rs`:

```rust
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    HTLCNotFound = 5,
    HTLCExpired = 6,
    HTLCNotExpired = 7,
    InvalidSecret = 8,
    AlreadyClaimed = 9,
    AlreadyRefunded = 10,
    InvalidHashLength = 11,
    InvalidTimelock = 12,
    OrderNotFound = 13,
    OrderAlreadyMatched = 14,
    OrderExpired = 15,
    InvalidChain = 16,
    ProofVerificationFailed = 17,
}
```

## Error Categories

### 1. Initialization Errors (1-2)

| Error | Code | When It Occurs | Recovery |
|-------|------|----------------|----------|
| `AlreadyInitialized` | 1 | Calling `init()` when contract is already initialized | No recovery needed - contract is already ready |
| `NotInitialized` | 2 | Calling contract functions before `init()` | Call `init()` first |

### 2. Authorization Errors (3)

| Error | Code | When It Occurs | Recovery |
|-------|------|----------------|----------|
| `Unauthorized` | 3 | User lacks permission for operation | Use correct authorized address |

**Scenarios:**
- Non-admin trying to add supported chain
- Wrong sender trying to refund HTLC
- Non-creator trying to cancel order

### 3. Validation Errors (4, 11-12)

| Error | Code | When It Occurs | Recovery |
|-------|------|----------------|----------|
| `InvalidAmount` | 4 | Amount ≤ 0 | Provide positive amount |
| `InvalidHashLength` | 11 | Hash not exactly 32 bytes | Use SHA-256 hash (32 bytes) |
| `InvalidTimelock` | 12 | Timelock in past or equals current time | Use future timestamp |

### 4. HTLC State Errors (5-10)

| Error | Code | When It Occurs | Recovery |
|-------|------|----------------|----------|
| `HTLCNotFound` | 5 | Referencing non-existent HTLC | Use valid HTLC ID |
| `HTLCExpired` | 6 | Claiming after timelock expiry | Cannot claim - use refund |
| `HTLCNotExpired` | 7 | Refunding before timelock expiry | Wait for expiry or claim |
| `InvalidSecret` | 8 | Wrong secret provided | Use correct secret |
| `AlreadyClaimed` | 9 | Operating on claimed HTLC | No action needed - swap complete |
| `AlreadyRefunded` | 10 | Operating on refunded HTLC | No action needed - funds returned |

### 5. Order State Errors (13-15)

| Error | Code | When It Occurs | Recovery |
|-------|------|----------------|----------|
| `OrderNotFound` | 13 | Referencing non-existent order | Use valid order ID |
| `OrderAlreadyMatched` | 14 | Operating on matched order | Cannot modify - use matched order |
| `OrderExpired` | 15 | Matching after order expiry | Create new order |

### 6. Cross-Chain Errors (16-17)

| Error | Code | When It Occurs | Recovery |
|-------|------|----------------|----------|
| `InvalidChain` | 16 | Unsupported blockchain | Use supported chain |
| `ProofVerificationFailed` | 17 | Invalid or incorrect proof | Verify proof generation |

## Error Handling Patterns

### Pattern 1: Early Validation

Validate inputs at the start of functions:

```rust
pub fn create_htlc(/* ... */) -> Result<u64, Error> {
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    
    if hash_lock.len() != 32 {
        return Err(Error::InvalidHashLength);
    }
    
    if time_lock <= env.ledger().timestamp() {
        return Err(Error::InvalidTimelock);
    }
    
    // Proceed with logic
}
```

### Pattern 2: State Checks

Check state before state-changing operations:

```rust
pub fn claim_htlc(/* ... */) -> Result<(), Error> {
    let mut htlc = storage::read_htlc(env, htlc_id)?;
    
    if htlc.status != HTLCStatus::Active {
        return Err(Error::AlreadyClaimed);
    }
    
    if env.ledger().timestamp() >= htlc.time_lock {
        return Err(Error::HTLCExpired);
    }
    
    // Verify secret and update state
}
```

### Pattern 3: Authorization Checks

Verify authorization before operations:

```rust
pub fn refund_htlc(/* ... */) -> Result<(), Error> {
    let htlc = storage::read_htlc(env, htlc_id)?;
    
    if htlc.sender != sender {
        return Err(Error::Unauthorized);
    }
    
    // Proceed with refund
}
```

### Pattern 4: Existence Checks

Check for existence before operations:

```rust
pub fn get_htlc(/* ... */) -> Result<HTLC, Error> {
    storage::read_htlc(env, htlc_id)
        .ok_or(Error::HTLCNotFound)
}
```

## Client Error Handling

### JavaScript/TypeScript

```typescript
import { Contract, InvokeError } from '@stellar/stellar-sdk';

async function createHTLC(/* ... */) {
  try {
    const result = await contract.create_htlc(/* ... */);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof InvokeError) {
      const errorCode = parseInt(error.message);
      
      switch (errorCode) {
        case 4:
          return { success: false, error: 'Invalid amount' };
        case 11:
          return { success: false, error: 'Invalid hash length' };
        case 12:
          return { success: false, error: 'Invalid timelock' };
        default:
          return { success: false, error: `Error ${errorCode}` };
      }
    }
    throw error;
  }
}
```

### Python

```python
from stellar_sdk import Contract

def handle_contract_error(error_code: int) -> str:
    error_messages = {
        1: "Contract already initialized",
        2: "Contract not initialized",
        3: "Unauthorized",
        4: "Invalid amount",
        5: "HTLC not found",
        6: "HTLC expired",
        7: "HTLC not expired",
        8: "Invalid secret",
        9: "HTLC already claimed",
        10: "HTLC already refunded",
        11: "Invalid hash length",
        12: "Invalid timelock",
        13: "Order not found",
        14: "Order already matched",
        15: "Order expired",
        16: "Invalid chain",
        17: "Proof verification failed",
    }
    return error_messages.get(error_code, f"Unknown error: {error_code}")
```

## Best Practices

### 1. Use Specific Error Messages

Include context in error messages when logging:

```typescript
// Good
console.error(`Failed to create HTLC: ${error.message} (code: ${error.code})`);

// Bad
console.error('Operation failed');
```

### 2. Implement Retry Logic

For transient errors, implement exponential backoff:

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 3. Validate Before Submitting

Validate inputs client-side before submitting to contract:

```typescript
function validateHTLCParams(amount: bigint, hashLock: Buffer, timeLock: number) {
  if (amount <= 0n) {
    return { valid: false, error: 'Amount must be positive' };
  }
  
  if (hashLock.length !== 32) {
    return { valid: false, error: 'Hash must be 32 bytes' };
  }
  
  if (timeLock <= Date.now() / 1000) {
    return { valid: false, error: 'Timelock must be in future' };
  }
  
  return { valid: true };
}
```

### 4. Handle Race Conditions

For timelock-related operations, handle race conditions:

```typescript
async function claimOrRefund(htlcId: string) {
  const htlc = await getHTLC(htlcId);
  
  if (htlc.status === 'Claimed' || htlc.status === 'Refunded') {
    return htlc.status;
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  if (now >= htlc.timeLock) {
    // Refund
    return await refundHTLC(htlcId);
  } else {
    // Claim
    return await claimHTLC(htlcId, secret);
  }
}
```

## Error Recovery Strategies

### HTLC Errors

| Error | Recovery Strategy |
|-------|-------------------|
| `HTLCNotFound` | Check HTLC ID, verify creation transaction |
| `HTLCExpired` | Call `refund_htlc()` to recover funds |
| `HTLCNotExpired` | Wait for expiry or claim with secret |
| `InvalidSecret` | Obtain correct secret from counterparty |
| `AlreadyClaimed` | No action needed, swap complete |
| `AlreadyRefunded` | No action needed, funds returned |

### Order Errors

| Error | Recovery Strategy |
|-------|-------------------|
| `OrderNotFound` | Check order ID, verify creation transaction |
| `OrderAlreadyMatched` | Proceed with swap execution |
| `OrderExpired` | Create new order with updated parameters |

### Authorization Errors

| Error | Recovery Strategy |
|-------|-------------------|
| `Unauthorized` | Verify correct address is signing transaction |

## Testing Error Handling

All errors are tested in `smartcontract/src/test.rs`. Example test pattern:

```rust
#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_error_invalid_amount_zero_htlc() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    
    client.init(&admin);
    
    // Attempt to create HTLC with zero amount
    // Should panic with "InvalidAmount"
    create_htlc_with_amount(&client, &sender, &receiver, 0);
}
```

## Monitoring and Alerts

### Error Rate Monitoring

Monitor error rates to detect anomalies:

```typescript
// Track error occurrences
const errorCounts = new Map<number, number>();

function trackError(errorCode: number) {
  const count = errorCounts.get(errorCode) || 0;
  errorCounts.set(errorCode, count + 1);
  
  // Alert on high error rates
  if (count > THRESHOLD) {
    alertTeam(`High error rate for error code ${errorCode}`);
  }
}
```

### Common Error Patterns

Watch for these patterns:

1. **High `InvalidSecret` rate**: May indicate communication issue
2. **High `HTLCExpired` rate**: May indicate performance issues
3. **High `Unauthorized` rate**: May indicate attempted attacks

## Related Documentation

- [Smart Contract Documentation](./SMARTCONTRACT.md)
- [HTLC Protocol Specification](./HTLC.md)
- [Storage Layout](./STORAGE_LAYOUT.md)
