"""Tests for HTLC API endpoints."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.schemas.htlc import HTLCResponse


class TestHTLCSchemas:
    """HTLC schema validation tests."""

    def test_htlc_response_from_dict(self):
        data = {
            "id": "htlc-001",
            "token": "USDC",
            "amount_stroops": "10000000",
            "hash_lock": "abc123",
            "time_lock": 1735689600,
            "sender": "GABC",
            "receiver": "GDEF",
            "state": "locked",
        }
        resp = HTLCResponse(**data)
        assert resp.id == "htlc-001"
        assert resp.state == "locked"
        assert resp.amount_stroops == "10000000"


class TestHTLCEndpoints:
    """HTLC route tests."""

    @pytest.mark.anyio
    async def test_list_htlcs_returns_empty(self):
        from app.routes.htlc import list_htlcs

        mock_db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=result_mock)

        result = await list_htlcs(db=mock_db)
        assert result == []

    @pytest.mark.anyio
    async def test_get_htlc_not_found(self):
        from app.routes.htlc import get_htlc
        from fastapi import HTTPException

        mock_db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result_mock)

        with pytest.raises(HTTPException) as exc_info:
            await get_htlc("nonexistent", db=mock_db)
        assert exc_info.value.status_code == 404
