from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class OrderCreate(BaseModel):
    creator: str
    from_chain: str
    to_chain: str
    from_asset: str
    to_asset: str
    from_amount: int = Field(gt=0)
    to_amount: int = Field(gt=0)
    min_fill_amount: Optional[int] = None
    expiry: int = Field(gt=0)


class OrderMatch(BaseModel):
    counterparty: str
    fill_amount: Optional[int] = None


class OrderResponse(BaseModel):
    id: str
    onchain_id: Optional[int] = None
    creator: str
    from_chain: str
    to_chain: str
    from_asset: str
    to_asset: str
    from_amount: int
    to_amount: int
    min_fill_amount: Optional[int] = None
    filled_amount: int = 0
    expiry: int
    status: str
    counterparty: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
