#![no_std]

mod error;
mod htlc;
mod optimization;
mod order;
mod storage;
mod swap;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Bytes, Env, String};

use crate::error::Error;
use crate::types::{
    Chain, ChainProof, CrossChainSwap, HTLCStatus, StorageMetrics, SwapOrder, HTLC,
};

#[contract]
pub struct ChainBridge;

#[contractimpl]
impl ChainBridge {
    /// Initialize the cross-chain bridge protocol
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if storage::has_admin(&env) {
            return Err(Error::AlreadyInitialized);
        }
        storage::write_admin(&env, &admin);
        Ok(())
    }

    /// Create a Hash Time-Locked Contract
    pub fn create_htlc(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
        hash_lock: soroban_sdk::BytesN<32>,
        time_lock: u64,
    ) -> Result<u64, Error> {
        sender.require_auth();
        htlc::create_htlc(&env, &sender, &receiver, amount, hash_lock, time_lock)
    }

    /// Claim HTLC by revealing the secret
    pub fn claim_htlc(
        env: Env,
        receiver: Address,
        htlc_id: u64,
        secret: Bytes,
    ) -> Result<(), Error> {
        receiver.require_auth();
        htlc::claim_htlc(&env, htlc_id, secret)
    }

    /// Refund HTLC after timelock expires
    pub fn refund_htlc(env: Env, sender: Address, htlc_id: u64) -> Result<(), Error> {
        sender.require_auth();
        htlc::refund_htlc(&env, htlc_id, &sender)
    }

    /// Get HTLC details
    pub fn get_htlc(env: Env, htlc_id: u64) -> Result<HTLC, Error> {
        storage::read_htlc(&env, htlc_id).ok_or(Error::HTLCNotFound)
    }

    /// Get HTLC status
    pub fn get_htlc_status(env: Env, htlc_id: u64) -> Result<HTLCStatus, Error> {
        htlc::get_htlc_status(&env, htlc_id)
    }

    /// Get revealed secret (if claimed)
    pub fn get_secret(env: Env, htlc_id: u64) -> Result<Option<Bytes>, Error> {
        htlc::get_revealed_secret(&env, htlc_id)
    }

    /// Create a swap order
    pub fn create_order(
        env: Env,
        creator: Address,
        from_chain: Chain,
        to_chain: Chain,
        from_asset: String,
        to_asset: String,
        from_amount: i128,
        to_amount: i128,
        expiry: u64,
    ) -> Result<u64, Error> {
        creator.require_auth();
        order::create_order(
            &env,
            &creator,
            from_chain,
            to_chain,
            from_asset,
            to_asset,
            from_amount,
            to_amount,
            expiry,
        )
    }

    /// Match and execute a swap order
    pub fn match_order(env: Env, counterparty: Address, order_id: u64) -> Result<u64, Error> {
        counterparty.require_auth();
        order::match_order(&env, &counterparty, order_id)
    }

    /// Get swap order details
    pub fn get_order(env: Env, order_id: u64) -> Result<SwapOrder, Error> {
        storage::read_order(&env, order_id).ok_or(Error::OrderNotFound)
    }

    /// Cancel a swap order
    pub fn cancel_order(env: Env, creator: Address, order_id: u64) -> Result<(), Error> {
        creator.require_auth();
        order::cancel_order(&env, &creator, order_id)
    }

    /// Verify cross-chain proof
    pub fn verify_proof(env: Env, proof: ChainProof) -> Result<bool, Error> {
        swap::verify_chain_proof(&env, &proof)
    }

    /// Complete cross-chain swap
    pub fn complete_swap(env: Env, swap_id: u64, proof: ChainProof) -> Result<(), Error> {
        swap::complete_cross_chain_swap(&env, swap_id, proof)
    }

    /// Get swap details
    pub fn get_swap(env: Env, swap_id: u64) -> Result<CrossChainSwap, Error> {
        storage::read_swap(&env, swap_id).ok_or(Error::HTLCNotFound)
    }

    /// Add supported chain (admin only)
    pub fn add_chain(env: Env, admin: Address, chain_id: u32) -> Result<(), Error> {
        admin.require_auth();
        let stored_admin = storage::read_admin(&env);
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }
        storage::add_supported_chain(&env, chain_id);
        Ok(())
    }

    /// Get storage metrics
    pub fn get_storage_metrics(env: Env) -> StorageMetrics {
        storage::get_storage_metrics(&env)
    }

    /// Cleanup expired HTLCs
    pub fn cleanup_expired_htlcs(env: Env) -> u64 {
        storage::cleanup_expired_htlcs(&env)
    }

    /// Mark HTLC for cleanup
    pub fn mark_htlc_expired(env: Env, htlc_id: u64) -> Result<(), Error> {
        storage::add_expired_htlc(&env, htlc_id);
        Ok(())
    }
}

#[cfg(test)]
mod test;
