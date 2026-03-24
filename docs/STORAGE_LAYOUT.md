# Storage Layout and Optimization

## Overview

This document describes the storage layout decisions, optimizations, and best practices for the ChainBridge smart contract.

## Storage Architecture

### Soroban Storage Types

Soroban provides two storage types:

1. **Instance Storage**
   - Stored with the contract instance
   - Lower read/write costs
   - Best for frequently accessed data
   - Limited to ~64KB total

2. **Persistent Storage**
   - Separate from contract instance
   - Higher costs but unlimited size
   - Best for large or infrequently accessed data

### Storage Key Design

```rust
#[contracttype]
pub enum DataKey {
    Admin,                    // Instance: Admin address
    HTLCCounter,             // Instance: HTLC ID counter
    HTLC(u64),              // Persistent: HTLC data
    OrderCounter,            // Instance: Order ID counter
    Order(u64),             // Persistent: Order data
    SwapCounter,             // Instance: Swap ID counter
    Swap(u64),               // Persistent: Swap data
    SupportedChain(u8),      // Persistent: Supported chain flags
    ExpiredHTLCs,            // Instance: Expired HTLC counter
    ExpiredHTLCQueue(u64),   // Instance: Cleanup queue
    StorageMetrics,          // Instance: Metrics snapshot
}
```

## Data Structures

### HTLC Structure

```rust
pub struct HTLC {
    pub sender: Address,        // 32 bytes
    pub receiver: Address,      // 32 bytes
    pub amount: i128,           // 16 bytes
    pub hash_lock: Bytes,       // 32 bytes (SHA256)
    pub time_lock: u64,         // 8 bytes
    pub status: HTLCStatus,     // 1 byte (enum variant)
    pub secret: Option<Bytes>,  // 1 + 32 bytes (optional)
    pub created_at: u64,        // 8 bytes
}
```

**Estimated Size**: ~162 bytes per HTLC

### SwapOrder Structure

```rust
pub struct SwapOrder {
    pub id: u64,                    // 8 bytes
    pub creator: Address,           // 32 bytes
    pub from_chain: Chain,          // 1 byte (enum)
    pub to_chain: Chain,            // 1 byte (enum)
    pub from_asset: String,         // ~12 bytes (symbol)
    pub to_asset: String,           // ~12 bytes (symbol)
    pub from_amount: i128,          // 16 bytes
    pub to_amount: i128,            // 16 bytes
    pub expiry: u64,                // 8 bytes
    pub matched: bool,              // 1 byte
    pub counterparty: Option<Address>, // 1 + 32 bytes
}
```

**Estimated Size**: ~140 bytes per Order

### CrossChainSwap Structure

```rust
pub struct CrossChainSwap {
    pub id: u64,                // 8 bytes
    pub stellar_htlc_id: u64,   // 8 bytes
    pub other_chain: Chain,     // 1 byte
    pub other_chain_tx: String, // ~64 bytes (tx hash)
    pub stellar_party: Address, // 32 bytes
    pub other_party: String,    // ~42 bytes (address)
    pub completed: bool,        // 1 byte
}
```

**Estimated Size**: ~156 bytes per Swap

## Optimizations

### 1. Storage Location Strategy

| Data Type | Storage Location | Rationale |
|-----------|------------------|-----------|
| Counters | Instance | Frequently accessed, small |
| Admin | Instance | Rarely changed, frequently checked |
| HTLCs | Persistent | Large, accessed per swap |
| Orders | Persistent | Large, accessed per order |
| Swaps | Persistent | Large, accessed per swap |
| Metrics | Instance | Small snapshot, frequently read |
| Cleanup Queue | Instance | Small, frequently updated |

### 2. Expired Data Cleanup

Expired HTLCs are queued for cleanup:

```rust
// When HTLC expires, add to cleanup queue
pub fn add_expired_htlc(env: &Env, htlc_id: u64) {
    let counter = get_expired_htlc_counter(env);
    env.storage().instance().set(&DataKey::ExpiredHTLCQueue(counter), &htlc_id);
    set_expired_htlc_counter(env, counter + 1);
}

// Batch cleanup (10 at a time to limit gas)
pub fn cleanup_expired_htlcs(env: &Env) -> u64 {
    // Process up to 10 expired HTLCs
    // Remove from persistent storage
}
```

**Benefits**:
- Reduces storage bloat
- Gas-efficient batch processing
- Configurable batch size

### 3. Order Removal on Cancel

When an order is cancelled, it's immediately removed from storage:

```rust
pub fn cancel_order(env: &Env, creator: &Address, order_id: u64) -> Result<(), Error> {
    // Validate and remove
    storage::remove_order(env, order_id);
    Ok(())
}
```

**Benefits**:
- Immediate storage recovery
- No "tombstone" records

### 4. Minimal Status Enums

Use smallest possible enum variants:

```rust
pub enum HTLCStatus {
    Active,    // 0
    Claimed,   // 1
    Refunded,  // 2
    Expired,   // 3
}
// Serialized as single byte
```

### 5. Asset Symbol Length Limits

```rust
pub const MAX_ASSET_SYMBOL_LEN: usize = 12;

// Validation
pub fn validate_asset_symbol_len(asset: &String) -> bool {
    asset.len() <= MAX_ASSET_SYMBOL_LEN
}
```

## Storage Costs

### Approximate Costs (Stellar Testnet)

| Operation | Cost (stroops) |
|-----------|----------------|
| Instance Read | ~1,000 |
| Instance Write | ~5,000 |
| Persistent Read | ~5,000 |
| Persistent Write | ~20,000 |
| Persistent Remove | ~500 |

### Cost Optimization Tips

1. **Batch Operations**: Process multiple items in single transaction
2. **Use Instance Storage**: For frequently accessed small data
3. **Clean Up Expired Data**: Reduce storage footprint
4. **Minimize Writes**: Cache reads, batch writes
5. **Use Smaller Data Types**: u8 vs u64 when possible

## Migration Strategy

### Version Tracking

```rust
#[contracttype]
pub enum DataKey {
    // ... existing keys
    StorageVersion,  // Track current version
}

const CURRENT_VERSION: u32 = 1;
```

### Migration Functions

```rust
pub fn migrate_storage(env: Env, from_version: u32) -> Result<(), Error> {
    match from_version {
        0 => migrate_v0_to_v1(&env)?,
        _ => return Err(Error::InvalidMigration),
    }
    
    env.storage().instance().set(&DataKey::StorageVersion, &CURRENT_VERSION);
    Ok(())
}
```

### Adding New Fields

When adding fields to existing structures:

1. Make new fields optional: `Option<NewType>`
2. Provide default values
3. Update all read paths to handle missing data

Example:

```rust
pub struct HTLC {
    // ... existing fields
    pub refund_address: Option<Address>,  // New field
}

// Read with default
let htlc = storage::read_htlc(&env, id)?;
let refund_addr = htlc.refund_address.unwrap_or(htlc.sender);
```

## Monitoring

### Storage Metrics

```rust
pub struct StorageMetrics {
    pub total_htlcs: u64,
    pub active_htlcs: u64,
    pub expired_htlcs: u64,
    pub total_orders: u64,
    pub open_orders: u64,
    pub total_swaps: u64,
    pub storage_used_bytes: u64,
}

pub fn get_storage_metrics(env: Env) -> StorageMetrics {
    storage::get_storage_metrics(&env)
}
```

### Recommended Monitoring

1. **Storage Growth Rate**: Track bytes per day
2. **Expired vs Active Ratio**: Should be < 10%
3. **Cleanup Effectiveness**: Monitor batch sizes
4. **Cost per Transaction**: Track average costs

## Best Practices

### 1. Key Design

- Use descriptive enum variants
- Group related data
- Keep keys minimal

### 2. Data Design

- Use smallest sufficient types
- Avoid redundant fields
- Consider compression for large data

### 3. Access Patterns

- Cache frequent reads
- Batch writes when possible
- Use events for off-chain indexing

### 4. Gas Optimization

- Estimate costs before deploying
- Test with realistic data volumes
- Monitor mainnet costs

### 5. Maintenance

- Schedule regular cleanups
- Monitor storage metrics
- Plan for migrations

## Future Optimizations

### Phase 2

1. **Merkle Trees**: Batch storage proofs
2. **Compression**: Reduce large data size
3. **Off-chain Storage**: Store large data off-chain with hashes
4. **Lazy Cleanup**: Automatic cleanup on access

### Phase 3

1. **Storage Rent**: Pay for storage over time
2. **Archival**: Move old data to cheaper storage
3. **Sharding**: Split data across multiple contracts

## References

- [Soroban Storage Documentation](https://soroban.stellar.org/docs/learn/storage)
- [Stellar Storage Costs](https://soroban.stellar.org/docs/learn/fees)
- [Smart Contract Best Practices](https://github.com/stellar/soroban-examples)
