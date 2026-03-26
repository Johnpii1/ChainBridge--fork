from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SwapProof(BaseModel):
    chain: str
    tx_hash: str
    block_height: int
    proof_data: str


class SwapResponse(BaseModel):
    id: str
    onchain_id: Optional[str] = None
    stellar_htlc_id: Optional[str] = None
    other_chain: str
    other_chain_tx: Optional[str] = None
    stellar_party: str
    other_party: str
    state: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
