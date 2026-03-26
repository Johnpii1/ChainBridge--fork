"""Tests for order book API endpoints."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.schemas.order import OrderResponse


class TestOrderSchemas:
    """Order schema validation tests."""

    def test_order_response_from_dict(self):
        data = {
            "id": "order-001",
            "creator": "GABC123",
            "sell_token": "XLM",
            "buy_token": "USDC",
            "sell_amount_stroops": "50000000",
            "buy_amount_stroops": "10000000",
            "state": "open",
        }
        resp = OrderResponse(**data)
        assert resp.id == "order-001"
        assert resp.state == "open"


class TestOrderEndpoints:
    """Order route tests."""

    @pytest.mark.anyio
    async def test_list_orders_returns_empty(self):
        from app.routes.orders import list_orders

        mock_db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=result_mock)

        result = await list_orders(db=mock_db)
        assert result == []
