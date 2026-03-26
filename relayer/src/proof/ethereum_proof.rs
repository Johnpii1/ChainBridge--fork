/// Ethereum receipt/log proof generation.
///
/// Generates a proof that a specific event was emitted in an Ethereum
/// transaction, using the transaction receipt's Merkle Patricia Trie
/// proof against the block's receiptsRoot.

/// A proof for an Ethereum event/receipt.
pub struct EthereumReceiptProof {
    pub tx_hash: String,
    pub block_hash: String,
    pub block_number: u64,
    pub receipt_proof: Vec<Vec<u8>>,
    pub log_index: u32,
}

/// Encode a proof for submission to the Stellar contract.
///
/// The Soroban contract expects proof_data as a hex-encoded byte
/// string containing the serialized proof components.
pub fn encode_proof_for_stellar(proof: &EthereumReceiptProof) -> String {
    // Serialize proof components into a single byte vector:
    // [block_number (8 bytes)] [log_index (4 bytes)] [receipt_proof_count (4 bytes)]
    // [proof_node_length (4 bytes) + proof_node_data] ...
    let mut data = Vec::new();

    data.extend_from_slice(&proof.block_number.to_be_bytes());
    data.extend_from_slice(&proof.log_index.to_be_bytes());
    data.extend_from_slice(&(proof.receipt_proof.len() as u32).to_be_bytes());

    for node in &proof.receipt_proof {
        data.extend_from_slice(&(node.len() as u32).to_be_bytes());
        data.extend_from_slice(node);
    }

    hex::encode(data)
}
