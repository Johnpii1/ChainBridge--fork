from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class HTLCCreate(BaseModel):
    sender: str
    receiver: str
    amount: int = Field(gt=0)
    hash_lock: str
    time_lock: int = Field(gt=0)
    hash_algorithm: str = "sha256"


class HTLCClaim(BaseModel):
    secret: str


class HTLCResponse(BaseModel):
    id: str
    onchain_id: Optional[str] = None
    sender: str
    receiver: str
    amount: int
    hash_lock: str
    time_lock: int
    status: str
    secret: Optional[str] = None
    hash_algorithm: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
