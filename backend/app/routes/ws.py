import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from app.middleware.auth import decode_jwt_token
from app.ws.manager import ConnectionManager
from app.config.redis import get_redis

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_manager(websocket: WebSocket) -> ConnectionManager:
    """Dependency to get the WebSocket manager from the app state."""
    return websocket.app.state.ws_manager


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    manager: ConnectionManager = Depends(get_manager),
):
    """
    Main WebSocket endpoint for real-time updates (#30).
    Authenticate with JWT via query param 'token'.
    """
    # Authenticate
    if not token or not decode_jwt_token(token):
        await websocket.close(code=1008)  # Policy Violation
        return

    await manager.connect(websocket)
    
    try:
        while True:
            # Wait for messages from the client (subscriptions or pokes)
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                
                if msg_type == "subscribe":
                    channel = message.get("channel")
                    if channel:
                        await manager.subscribe(websocket, channel)
                        await websocket.send_text(json.dumps({
                            "type": "subscribed",
                            "channel": channel
                        }))
                
                elif msg_type == "unsubscribe":
                    channel = message.get("channel")
                    if channel:
                        await manager.unsubscribe(websocket, channel)
                        await websocket.send_text(json.dumps({
                            "type": "unsubscribed",
                            "channel": channel
                        }))
                
                elif msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                
                else:
                    logger.warning(f"Unknown message type: {msg_type}")
                    
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
