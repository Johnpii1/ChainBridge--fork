#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Bytes, Env, String,
};

fn setup_contract() -> (Env, Address, ChainBridgeClient<'static>) {
    let env = Env::default();
    let contract_id = env.register_contract(None, ChainBridge);
    let client = ChainBridgeClient::new(&env, &contract_id);
    (env, contract_id, client)
}

fn create_test_htlc(
    env: &Env,
    client: &ChainBridgeClient,
    sender: &Address,
    receiver: &Address,
    amount: i128,
    secret_bytes: &[u8; 32],
    duration_secs: u64,
) -> u64 {
    let secret = Bytes::from_slice(env, secret_bytes);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + duration_secs;
    client.create_htlc(sender, receiver, &amount, &hash_lock, &time_lock)
}

// =============================================================================
// INITIALIZATION ERROR TESTS
// =============================================================================

#[test]
fn test_init_success() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);

    let result = client.init(&admin);
    assert!(result.is_ok());
}

#[test]
#[should_panic(expected = "AlreadyInitialized")]
fn test_error_already_initialized() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);

    client.init(&admin);
    client.init(&admin);
}

// =============================================================================
// AMOUNT ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_error_invalid_amount_zero_htlc() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 86400;

    client.create_htlc(&sender, &receiver, &0, &hash_lock, &time_lock);
}

#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_error_invalid_amount_negative_htlc() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 86400;

    client.create_htlc(&sender, &receiver, &-1000, &hash_lock, &time_lock);
}

#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_error_invalid_amount_zero_order() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 86400;

    client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &0,
        &1000,
        &expiry,
    );
}

// =============================================================================
// HASH LENGTH ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "InvalidHashLength")]
fn test_error_invalid_hash_length_too_short() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let short_hash = Bytes::from_slice(&env, &[1u8; 16]);
    let time_lock = env.ledger().timestamp() + 86400;

    client.create_htlc(&sender, &receiver, &1000, &short_hash, &time_lock);
}

#[test]
#[should_panic(expected = "InvalidHashLength")]
fn test_error_invalid_hash_length_too_long() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let long_hash = Bytes::from_slice(&env, &[1u8; 64]);
    let time_lock = env.ledger().timestamp() + 86400;

    client.create_htlc(&sender, &receiver, &1000, &long_hash, &time_lock);
}

#[test]
fn test_valid_hash_length_32_bytes() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 86400;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);
    assert!(htlc_id > 0);
}

// =============================================================================
// TIMELOCK ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "InvalidTimelock")]
fn test_error_invalid_timelock_past() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let past_time = env.ledger().timestamp() - 100;

    client.create_htlc(&sender, &receiver, &1000, &hash_lock, &past_time);
}

#[test]
#[should_panic(expected = "InvalidTimelock")]
fn test_error_invalid_timelock_now() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let now = env.ledger().timestamp();

    client.create_htlc(&sender, &receiver, &1000, &hash_lock, &now);
}

#[test]
#[should_panic(expected = "InvalidTimelock")]
fn test_error_invalid_order_expiry_past() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.init(&admin);

    let past_time = env.ledger().timestamp() - 100;

    client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &past_time,
    );
}

// =============================================================================
// HTLC NOT FOUND ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "HTLCNotFound")]
fn test_error_htlc_not_found_get() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);

    client.init(&admin);

    client.get_htlc(&999);
}

#[test]
#[should_panic(expected = "HTLCNotFound")]
fn test_error_htlc_not_found_claim() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let receiver = Address::generate(&env);
    let secret = Bytes::from_slice(&env, &[1u8; 32]);

    client.init(&admin);

    client.claim_htlc(&receiver, &999, &secret);
}

#[test]
#[should_panic(expected = "HTLCNotFound")]
fn test_error_htlc_not_found_refund() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);

    client.init(&admin);

    client.refund_htlc(&sender, &999);
}

// =============================================================================
// UNAUTHORIZED ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_error_unauthorized_refund_wrong_sender() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let wrong_sender = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 100);

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);

    client.refund_htlc(&wrong_sender, &htlc_id);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_error_unauthorized_cancel_order_wrong_creator() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let wrong_user = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 86400;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    client.cancel_order(&wrong_user, &order_id);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_error_unauthorized_add_chain() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);

    client.init(&admin);

    client.add_chain(&non_admin, &1);
}

// =============================================================================
// SECRET/HASH VALIDATION ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "InvalidSecret")]
fn test_error_invalid_secret_wrong_secret() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let original_secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&original_secret);
    let time_lock = env.ledger().timestamp() + 86400;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    let wrong_secret = Bytes::from_slice(&env, &[2u8; 32]);
    client.claim_htlc(&receiver, &htlc_id, &wrong_secret);
}

#[test]
#[should_panic(expected = "InvalidSecret")]
fn test_error_invalid_secret_empty_secret() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 86400);

    let empty_secret = Bytes::from_slice(&env, &[]);
    client.claim_htlc(&receiver, &htlc_id, &empty_secret);
}

// =============================================================================
// ALREADY CLAIMED/REFUNDED ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "AlreadyClaimed")]
fn test_error_already_claimed_double_claim() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 86400;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    client.claim_htlc(&receiver, &htlc_id, &secret);
    client.claim_htlc(&receiver, &htlc_id, &secret);
}

#[test]
#[should_panic(expected = "AlreadyRefunded")]
fn test_error_already_refunded_double_refund() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 100);

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);

    client.refund_htlc(&sender, &htlc_id);
    client.refund_htlc(&sender, &htlc_id);
}

#[test]
#[should_panic(expected = "AlreadyClaimed")]
fn test_error_already_claimed_cannot_refund() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 86400;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    client.claim_htlc(&receiver, &htlc_id, &secret);

    env.ledger().set_timestamp(env.ledger().timestamp() + 86500);

    client.refund_htlc(&sender, &htlc_id);
}

// =============================================================================
// HTLC EXPIRED ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "HTLCExpired")]
fn test_error_htlc_expired_claim_after_timeout() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 100;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    env.ledger().set_timestamp(time_lock + 1);

    client.claim_htlc(&receiver, &htlc_id, &secret);
}

#[test]
#[should_panic(expected = "HTLCExpired")]
fn test_error_htlc_expired_claim_at_exact_timeout() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 100;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    env.ledger().set_timestamp(time_lock);

    client.claim_htlc(&receiver, &htlc_id, &secret);
}

// =============================================================================
// HTLC NOT EXPIRED ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "HTLCNotExpired")]
fn test_error_htlc_not_expired_refund_too_early() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 86400);

    client.refund_htlc(&sender, &htlc_id);
}

#[test]
#[should_panic(expected = "HTLCNotExpired")]
fn test_error_htlc_not_expired_refund_before_timeout() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 100);

    env.ledger().set_timestamp(env.ledger().timestamp() + 50);

    client.refund_htlc(&sender, &htlc_id);
}

// =============================================================================
// ORDER NOT FOUND ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "OrderNotFound")]
fn test_error_order_not_found_get() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);

    client.init(&admin);

    client.get_order(&999);
}

#[test]
#[should_panic(expected = "OrderNotFound")]
fn test_error_order_not_found_match() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.init(&admin);

    client.match_order(&counterparty, &999);
}

#[test]
#[should_panic(expected = "OrderNotFound")]
fn test_error_order_not_found_cancel() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.init(&admin);

    client.cancel_order(&creator, &999);
}

// =============================================================================
// ORDER ALREADY MATCHED ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "OrderAlreadyMatched")]
fn test_error_order_already_matched_double_match() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let counterparty1 = Address::generate(&env);
    let counterparty2 = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 86400;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    client.match_order(&counterparty1, &order_id);
    client.match_order(&counterparty2, &order_id);
}

#[test]
#[should_panic(expected = "OrderAlreadyMatched")]
fn test_error_order_already_matched_cannot_cancel() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 86400;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    client.match_order(&counterparty, &order_id);
    client.cancel_order(&creator, &order_id);
}

// =============================================================================
// ORDER EXPIRED ERROR TESTS
// =============================================================================

#[test]
#[should_panic(expected = "OrderExpired")]
fn test_error_order_expired_match_after_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 100;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    env.ledger().set_timestamp(expiry + 1);

    client.match_order(&counterparty, &order_id);
}

#[test]
#[should_panic(expected = "OrderExpired")]
fn test_error_order_expired_match_at_exact_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 100;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    env.ledger().set_timestamp(expiry);

    client.match_order(&counterparty, &order_id);
}

// =============================================================================
// SUCCESSFUL OPERATION TESTS
// =============================================================================

#[test]
fn test_htlc_claim_before_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 86400;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    env.ledger().set_timestamp(env.ledger().timestamp() + 43200);

    client.claim_htlc(&receiver, &htlc_id, &secret);

    let status = client.get_htlc_status(&htlc_id);
    assert_eq!(status, HTLCStatus::Claimed);
}

#[test]
fn test_htlc_refund_after_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 100);

    env.ledger().set_timestamp(env.ledger().timestamp() + 101);

    client.refund_htlc(&sender, &htlc_id);

    let status = client.get_htlc_status(&htlc_id);
    assert_eq!(status, HTLCStatus::Refunded);
}

#[test]
fn test_order_match_before_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 86400;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    env.ledger().set_timestamp(env.ledger().timestamp() + 43200);

    let swap_id = client.match_order(&counterparty, &order_id);
    assert!(swap_id > 0);
}

#[test]
fn test_order_cancel_before_match() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 86400;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    let result = client.cancel_order(&creator, &order_id);
    assert!(result.is_ok());
}

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

#[test]
fn test_htlc_claim_one_second_before_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let secret = Bytes::from_slice(&env, &[1u8; 32]);
    let hash_lock = env.crypto().sha256(&secret);
    let time_lock = env.ledger().timestamp() + 100;

    let htlc_id = client.create_htlc(&sender, &receiver, &1000, &hash_lock, &time_lock);

    env.ledger().set_timestamp(time_lock - 1);

    client.claim_htlc(&receiver, &htlc_id, &secret);

    let status = client.get_htlc_status(&htlc_id);
    assert_eq!(status, HTLCStatus::Claimed);
}

#[test]
fn test_htlc_refund_one_second_after_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 100);

    env.ledger().set_timestamp(env.ledger().timestamp() + 101);

    client.refund_htlc(&sender, &htlc_id);

    let status = client.get_htlc_status(&htlc_id);
    assert_eq!(status, HTLCStatus::Refunded);
}

#[test]
fn test_order_match_one_second_before_expiry() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.init(&admin);

    let expiry = env.ledger().timestamp() + 100;
    let order_id = client.create_order(
        &creator,
        &Chain::Bitcoin,
        &Chain::Ethereum,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "ETH"),
        &1000,
        &1000,
        &expiry,
    );

    env.ledger().set_timestamp(expiry - 1);

    let swap_id = client.match_order(&counterparty, &order_id);
    assert!(swap_id > 0);
}

// =============================================================================
// MULTIPLE HTLC TESTS
// =============================================================================

#[test]
fn test_multiple_htlcs_different_secrets() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc1_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 86400);
    let htlc2_id = create_test_htlc(&env, &client, &sender, &receiver, 2000, &[2u8; 32], 86400);
    let htlc3_id = create_test_htlc(&env, &client, &sender, &receiver, 3000, &[3u8; 32], 86400);

    assert_ne!(htlc1_id, htlc2_id);
    assert_ne!(htlc2_id, htlc3_id);
    assert_ne!(htlc1_id, htlc3_id);

    let htlc1 = client.get_htlc(&htlc1_id);
    let htlc2 = client.get_htlc(&htlc2_id);
    let htlc3 = client.get_htlc(&htlc3_id);

    assert_eq!(htlc1.amount, 1000);
    assert_eq!(htlc2.amount, 2000);
    assert_eq!(htlc3.amount, 3000);
}

#[test]
fn test_claim_different_htlcs_different_secrets() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    client.init(&admin);

    let htlc1_id = create_test_htlc(&env, &client, &sender, &receiver, 1000, &[1u8; 32], 86400);
    let htlc2_id = create_test_htlc(&env, &client, &sender, &receiver, 2000, &[2u8; 32], 86400);

    let secret1 = Bytes::from_slice(&env, &[1u8; 32]);
    let secret2 = Bytes::from_slice(&env, &[2u8; 32]);

    client.claim_htlc(&receiver, &htlc1_id, &secret1);
    client.claim_htlc(&receiver, &htlc2_id, &secret2);

    assert_eq!(client.get_htlc_status(&htlc1_id), HTLCStatus::Claimed);
    assert_eq!(client.get_htlc_status(&htlc2_id), HTLCStatus::Claimed);
}
