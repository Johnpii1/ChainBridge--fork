use soroban_sdk::{Bytes, Env};

pub const HASH_SIZE: usize = 32;
pub const ADDRESS_SIZE: usize = 32;
pub const MAX_ASSET_SYMBOL_LEN: usize = 12;

pub fn validate_hash_length(hash: &Bytes) -> bool {
    hash.len() == HASH_SIZE as u32
}

pub fn validate_asset_symbol_len(asset: &soroban_sdk::String) -> bool {
    asset.len() <= MAX_ASSET_SYMBOL_LEN as u32
}

pub fn estimate_htlc_size() -> u64 {
    let address_size = ADDRESS_SIZE as u64;
    let hash_size = HASH_SIZE as u64;
    let amount_size = 16u64;
    let timestamp_size = 8u64;
    let status_size = 1u64;
    let option_overhead = 1u64;

    address_size * 2
        + amount_size
        + hash_size
        + timestamp_size * 2
        + status_size
        + option_overhead
        + hash_size
}

pub fn estimate_order_size(asset_symbol_len: u64) -> u64 {
    let address_size = ADDRESS_SIZE as u64;
    let chain_size = 1u64;
    let amount_size = 16u64;
    let timestamp_size = 8u64;
    let bool_size = 1u64;

    address_size * 2
        + chain_size * 2
        + asset_symbol_len * 2
        + amount_size * 2
        + timestamp_size
        + bool_size
}

pub fn estimate_swap_size(tx_hash_len: u64, party_addr_len: u64) -> u64 {
    let id_size = 8u64;
    let chain_size = 1u64;
    let bool_size = 1u64;

    id_size * 2 + chain_size + tx_hash_len + party_addr_len + bool_size
}
