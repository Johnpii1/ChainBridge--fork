use crate::types::{CrossChainSwap, HTLCStatus, StorageMetrics, SwapOrder, HTLC};
use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    HTLCCounter,
    HTLC(u64),
    OrderCounter,
    Order(u64),
    SwapCounter,
    Swap(u64),
    SupportedChain(u32),
    ExpiredHTLCs,
    ExpiredHTLCQueue(u64),
    StorageMetrics,
}

const CLEANUP_BATCH_SIZE: u64 = 10;

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn read_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_htlc_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::HTLCCounter)
        .unwrap_or(0)
}

pub fn increment_htlc_counter(env: &Env) -> u64 {
    let counter = get_htlc_counter(env) + 1;
    env.storage()
        .instance()
        .set(&DataKey::HTLCCounter, &counter);
    counter
}

pub fn read_htlc(env: &Env, htlc_id: u64) -> Option<HTLC> {
    env.storage().persistent().get(&DataKey::HTLC(htlc_id))
}

pub fn write_htlc(env: &Env, htlc_id: u64, htlc: &HTLC) {
    env.storage()
        .persistent()
        .set(&DataKey::HTLC(htlc_id), htlc);
}

pub fn remove_htlc(env: &Env, htlc_id: u64) {
    env.storage().persistent().remove(&DataKey::HTLC(htlc_id));
}

pub fn get_order_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::OrderCounter)
        .unwrap_or(0)
}

pub fn increment_order_counter(env: &Env) -> u64 {
    let counter = get_order_counter(env) + 1;
    env.storage()
        .instance()
        .set(&DataKey::OrderCounter, &counter);
    counter
}

pub fn read_order(env: &Env, order_id: u64) -> Option<SwapOrder> {
    env.storage().persistent().get(&DataKey::Order(order_id))
}

pub fn write_order(env: &Env, order_id: u64, order: &SwapOrder) {
    env.storage()
        .persistent()
        .set(&DataKey::Order(order_id), order);
}

pub fn remove_order(env: &Env, order_id: u64) {
    env.storage().persistent().remove(&DataKey::Order(order_id));
}

pub fn get_swap_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::SwapCounter)
        .unwrap_or(0)
}

pub fn increment_swap_counter(env: &Env) -> u64 {
    let counter = get_swap_counter(env) + 1;
    env.storage()
        .instance()
        .set(&DataKey::SwapCounter, &counter);
    counter
}

pub fn read_swap(env: &Env, swap_id: u64) -> Option<CrossChainSwap> {
    env.storage().persistent().get(&DataKey::Swap(swap_id))
}

pub fn write_swap(env: &Env, swap_id: u64, swap: &CrossChainSwap) {
    env.storage()
        .persistent()
        .set(&DataKey::Swap(swap_id), swap);
}

pub fn remove_swap(env: &Env, swap_id: u64) {
    env.storage().persistent().remove(&DataKey::Swap(swap_id));
}

pub fn is_chain_supported(env: &Env, chain_id: u32) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::SupportedChain(chain_id))
}

pub fn add_supported_chain(env: &Env, chain_id: u32) {
    env.storage()
        .persistent()
        .set(&DataKey::SupportedChain(chain_id), &true);
}

pub fn add_expired_htlc(env: &Env, htlc_id: u64) {
    let counter = get_expired_htlc_counter(env);
    env.storage()
        .instance()
        .set(&DataKey::ExpiredHTLCQueue(counter), &htlc_id);
    set_expired_htlc_counter(env, counter + 1);
}

pub fn get_expired_htlc_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::ExpiredHTLCs)
        .unwrap_or(0)
}

pub fn set_expired_htlc_counter(env: &Env, count: u64) {
    env.storage().instance().set(&DataKey::ExpiredHTLCs, &count);
}

pub fn get_expired_htlc(env: &Env, index: u64) -> Option<u64> {
    env.storage()
        .instance()
        .get(&DataKey::ExpiredHTLCQueue(index))
}

pub fn remove_expired_htlc(env: &Env, index: u64) {
    env.storage()
        .instance()
        .remove(&DataKey::ExpiredHTLCQueue(index));
}

pub fn cleanup_expired_htlcs(env: &Env) -> u64 {
    let counter = get_expired_htlc_counter(env);
    let mut cleaned = 0u64;

    let batch_end = if counter > CLEANUP_BATCH_SIZE {
        CLEANUP_BATCH_SIZE
    } else {
        counter
    };

    for i in 0..batch_end {
        if let Some(htlc_id) = get_expired_htlc(env, i) {
            remove_htlc(env, htlc_id);
            remove_expired_htlc(env, i);
            cleaned += 1;
        }
    }

    if cleaned > 0 {
        let remaining = counter.saturating_sub(cleaned);
        set_expired_htlc_counter(env, remaining);
    }

    cleaned
}

pub fn get_storage_metrics(env: &Env) -> StorageMetrics {
    let total_htlcs = get_htlc_counter(env);
    let total_orders = get_order_counter(env);
    let total_swaps = get_swap_counter(env);

    let mut active_htlcs = 0u64;
    let mut expired_htlcs = 0u64;

    for i in 1..=total_htlcs {
        if let Some(htlc) = read_htlc(env, i) {
            match htlc.status {
                HTLCStatus::Active => active_htlcs += 1,
                HTLCStatus::Expired => expired_htlcs += 1,
                _ => {}
            }
        }
    }

    let mut open_orders = 0u64;
    for i in 1..=total_orders {
        if let Some(order) = read_order(env, i) {
            if !order.matched {
                open_orders += 1;
            }
        }
    }

    StorageMetrics {
        total_htlcs,
        active_htlcs,
        expired_htlcs,
        total_orders,
        open_orders,
        total_swaps,
        storage_used_bytes: 0,
    }
}

pub fn write_storage_metrics(env: &Env, metrics: &StorageMetrics) {
    env.storage()
        .instance()
        .set(&DataKey::StorageMetrics, metrics);
}
