use soroban_sdk::{contracttype, Address, Bytes, BytesN, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HTLCStatus {
    Active,
    Claimed,
    Refunded,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Chain {
    Bitcoin,
    Ethereum,
    Solana,
    Polygon,
    BSC,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SwapStatus {
    Open,
    Matched,
    Completed,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HTLC {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub hash_lock: BytesN<32>,
    pub time_lock: u64,
    pub status: HTLCStatus,
    pub secret: Option<Bytes>,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapOrder {
    pub id: u64,
    pub creator: Address,
    pub from_chain: Chain,
    pub to_chain: Chain,
    pub from_asset: String,
    pub to_asset: String,
    pub from_amount: i128,
    pub to_amount: i128,
    pub expiry: u64,
    pub matched: bool,
    pub counterparty: Option<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CrossChainSwap {
    pub id: u64,
    pub stellar_htlc_id: u64,
    pub other_chain: Chain,
    pub other_chain_tx: String,
    pub stellar_party: Address,
    pub other_party: String,
    pub completed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ChainProof {
    pub chain: Chain,
    pub tx_hash: String,
    pub block_height: u64,
    pub proof_data: Bytes,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageMetrics {
    pub total_htlcs: u64,
    pub active_htlcs: u64,
    pub expired_htlcs: u64,
    pub total_orders: u64,
    pub open_orders: u64,
    pub total_swaps: u64,
    pub storage_used_bytes: u64,
}

#[contracttype]
pub struct HTLCCleanupQueue {
    pub htlc_ids: soroban_sdk::Vec<u64>,
}
