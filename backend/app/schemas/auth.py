from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class APIKeyCreate(BaseModel):
    name: str
    owner: str


class APIKeyResponse(BaseModel):
    id: str
    key: str
    name: str
    owner: str
    is_active: bool
    request_count: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
