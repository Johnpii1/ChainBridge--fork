//! ChainBridge Relayer Service
//!
//! Monitors Bitcoin, Ethereum, and Stellar networks for HTLC events,
//! generates cross-chain proofs, and submits them to complete atomic swaps.

use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::sleep;

mod config;
mod monitor;
mod proof;

#[tokio::main]
async fn main() {
    println!("ChainBridge Relayer v0.1.0");
    println!("Starting chain monitors...");

    let config = config::RelayerConfig::from_env();

    // Spawn chain monitoring tasks
    let stellar_handle = tokio::spawn(monitor::stellar::monitor_loop(config.clone()));
    let bitcoin_handle = tokio::spawn(monitor::bitcoin::monitor_loop(config.clone()));
    let ethereum_handle = tokio::spawn(monitor::ethereum::monitor_loop(config.clone()));

    println!("Relayer running. Press Ctrl+C to stop.");

    // Wait for any monitor to exit (they shouldn't under normal operation)
    tokio::select! {
        r = stellar_handle => eprintln!("Stellar monitor exited: {:?}", r),
        r = bitcoin_handle => eprintln!("Bitcoin monitor exited: {:?}", r),
        r = ethereum_handle => eprintln!("Ethereum monitor exited: {:?}", r),
    }
}
