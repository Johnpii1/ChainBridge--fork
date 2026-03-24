use crate::error::Error;
use crate::storage;
use crate::types::{HTLCStatus, HTLC};
use soroban_sdk::{Address, Bytes, BytesN, Env};

const HASH_LENGTH: usize = 32; // SHA256 hash length

pub fn create_htlc(
    env: &Env,
    sender: &Address,
    receiver: &Address,
    amount: i128,
    hash_lock: BytesN<32>,
    time_lock: u64,
) -> Result<u64, Error> {
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }

    if hash_lock.len() != HASH_LENGTH as u32 {
        return Err(Error::InvalidHashLength);
    }

    let current_time = env.ledger().timestamp();
    if time_lock <= current_time {
        return Err(Error::InvalidTimelock);
    }

    let htlc_id = storage::increment_htlc_counter(env);

    let htlc = HTLC {
        sender: sender.clone(),
        receiver: receiver.clone(),
        amount,
        hash_lock: hash_lock.clone(),
        time_lock,
        status: HTLCStatus::Active,
        secret: None,
        created_at: current_time,
    };

    storage::write_htlc(env, htlc_id, &htlc);
    Ok(htlc_id)
}

pub fn claim_htlc(env: &Env, htlc_id: u64, secret: Bytes) -> Result<(), Error> {
    let mut htlc = storage::read_htlc(env, htlc_id).ok_or(Error::HTLCNotFound)?;

    if htlc.status != HTLCStatus::Active {
        return Err(Error::AlreadyClaimed);
    }

    let current_time = env.ledger().timestamp();
    if current_time >= htlc.time_lock {
        return Err(Error::HTLCExpired);
    }

    // Verify secret matches hash
    let computed_hash = env.crypto().sha256(&secret);
    let computed_hash: BytesN<32> = env.crypto().sha256(&secret).into();
    if computed_hash != htlc.hash_lock {
        return Err(Error::InvalidSecret);
    }

    htlc.status = HTLCStatus::Claimed;
    htlc.secret = Some(secret);
    storage::write_htlc(env, htlc_id, &htlc);

    Ok(())
}

pub fn refund_htlc(env: &Env, htlc_id: u64, sender: &Address) -> Result<(), Error> {
    let mut htlc = storage::read_htlc(env, htlc_id).ok_or(Error::HTLCNotFound)?;

    if htlc.sender != *sender {
        return Err(Error::Unauthorized);
    }

    if htlc.status != HTLCStatus::Active {
        return Err(Error::AlreadyRefunded);
    }

    let current_time = env.ledger().timestamp();
    if current_time < htlc.time_lock {
        return Err(Error::HTLCNotExpired);
    }

    htlc.status = HTLCStatus::Refunded;
    storage::write_htlc(env, htlc_id, &htlc);

    Ok(())
}

pub fn check_and_mark_expired(env: &Env, htlc_id: u64) -> Result<bool, Error> {
    let htlc = storage::read_htlc(env, htlc_id).ok_or(Error::HTLCNotFound)?;

    if htlc.status == HTLCStatus::Active {
        let current_time = env.ledger().timestamp();
        if current_time >= htlc.time_lock {
            storage::add_expired_htlc(env, htlc_id);
            return Ok(true);
        }
    }

    Ok(false)
}

pub fn get_htlc_status(env: &Env, htlc_id: u64) -> Result<HTLCStatus, Error> {
    let htlc = storage::read_htlc(env, htlc_id).ok_or(Error::HTLCNotFound)?;

    Ok(htlc.status)
}

pub fn get_revealed_secret(env: &Env, htlc_id: u64) -> Result<Option<Bytes>, Error> {
    let htlc = storage::read_htlc(env, htlc_id).ok_or(Error::HTLCNotFound)?;

    Ok(htlc.secret)
}
