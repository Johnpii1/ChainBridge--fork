from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.stellar import StellarClient, StellarConfig

app = FastAPI(
    title="ChainBridge API",
    description="Backend API for ChainBridge cross-chain atomic swaps",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Stellar client
stellar_config = StellarConfig.from_env()
stellar_client = StellarClient(stellar_config)


@app.get("/")
async def root():
    return {
        "name": "ChainBridge API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    stellar_health = await stellar_client.health_check()
    return {
        "status": "healthy",
        "stellar": stellar_health,
    }


@app.get("/stellar/latest-ledger")
async def latest_ledger():
    ledger = await stellar_client.get_latest_ledger()
    return {"latest_ledger": ledger}


@app.get("/stellar/events")
async def contract_events(start_ledger: int, limit: int = 100):
    events = await stellar_client.get_contract_events(start_ledger, limit)
    return {"events": events, "count": len(events)}


@app.get("/stellar/transaction/{tx_hash}")
async def transaction_status(tx_hash: str):
    status = await stellar_client.get_transaction_status(tx_hash)
    return status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
