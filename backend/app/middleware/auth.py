"""Authentication middleware: API key and JWT support (#27)."""

import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.config.settings import settings
from app.models.api_key import APIKey

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def generate_api_key() -> str:
    return f"cb_{secrets.token_urlsafe(32)}"


def create_jwt_token(subject: str) -> dict:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
    payload = {"sub": subject, "exp": expires, "iat": datetime.now(timezone.utc)}
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_expiration_minutes * 60,
    }


def decode_jwt_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError:
        return None


async def require_api_key(
    api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")

    result = await db.execute(select(APIKey).where(APIKey.key == api_key, APIKey.is_active == True))
    key_record = result.scalar_one_or_none()

    if not key_record:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")

    await db.execute(
        update(APIKey)
        .where(APIKey.id == key_record.id)
        .values(request_count=APIKey.request_count + 1, last_used_at=datetime.now(timezone.utc))
    )
    await db.commit()

    return key_record
