import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Set

from fastapi import WebSocket
from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections and Redis pub/sub subscriptions (#30)."""

    def __init__(self, redis: Redis):
        self.active_connections: Set[WebSocket] = set()
        self.subscriptions: Dict[str, Set[WebSocket]] = {}
        self.redis = redis
        self.pubsub_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        # Clean up subscriptions
        for channel in list(self.subscriptions.keys()):
            if websocket in self.subscriptions[channel]:
                self.subscriptions[channel].remove(websocket)
                if not self.subscriptions[channel]:
                    del self.subscriptions[channel]
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def subscribe(self, websocket: WebSocket, channel: str):
        if channel not in self.subscriptions:
            self.subscriptions[channel] = set()
        self.subscriptions[channel].add(websocket)
        logger.debug(f"Client subscribed to {channel}")

    async def unsubscribe(self, websocket: WebSocket, channel: str):
        if channel in self.subscriptions and websocket in self.subscriptions[channel]:
            self.subscriptions[channel].remove(websocket)
            if not self.subscriptions[channel]:
                del self.subscriptions[channel]
        logger.debug(f"Client unsubscribed from {channel}")

    async def broadcast(self, channel: str, message: Any):
        """Broadcast a message to all clients subscribed to a channel."""
        if channel not in self.subscriptions:
            return

        payload = json.dumps({"channel": channel, "data": message})
        disconnected = set()

        for connection in self.subscriptions[channel]:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)

        for connection in disconnected:
            self.disconnect(connection)

    async def start_redis_listener(self):
        """Listen for messages from Redis and broadcast to local connections."""
        pubsub = self.redis.pubsub()
        # Initial subscription to a broad pattern or specific common channels
        await pubsub.psubscribe("cb:*")
        
        logger.info("Started Redis pub/sub listener for WebSockets")
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    channel = message["channel"]
                    data = json.loads(message["data"])
                    # Map Redis channel (cb:orders) back to our internal channel (orders)
                    internal_channel = channel.replace("cb:", "")
                    await self.broadcast(internal_channel, data)
        except Exception as e:
            logger.error(f"Redis pub/sub listener error: {e}")
        finally:
            await pubsub.punsubscribe("cb:*")
            await pubsub.close()

    def start(self):
        if not self.pubsub_task:
            self.pubsub_task = asyncio.create_task(self.start_redis_listener())

    async def stop(self):
        if self.pubsub_task:
            self.pubsub_task.cancel()
            try:
                await self.pubsub_task
            except asyncio.CancelledError:
                pass
            self.pubsub_task = None
