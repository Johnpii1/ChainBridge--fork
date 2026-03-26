import { useCallback, useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
}

export function useWebSocket(url: string | null, token: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const listeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = useCallback(() => {
    if (!url || !token || ws.current?.readyState === WebSocket.CONNECTING) return;

    // Clean up existing connection
    if (ws.current) {
      ws.current.close();
    }

    const wsUrl = new URL(url);
    wsUrl.searchParams.set('token', token);

    const socket = new WebSocket(wsUrl.toString());

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected');
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket disconnected', event.reason);
      
      // Reconnect with 3s delay
      if (!event.wasClean) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    socket.onerror = (event) => {
      setError(new Error('WebSocket error'));
      console.error('WebSocket error', event);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const channelListeners = listeners.current.get(message.channel || message.type);
        if (channelListeners) {
          channelListeners.forEach((callback) => callback(message.data));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.current = socket;
  }, [url, token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) ws.current.close();
    };
  }, [connect]);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    if (!listeners.current.has(channel)) {
      listeners.current.set(channel, new Set());
      
      // If we're connected, send the subscription message
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'subscribe', channel }));
      }
    }
    
    listeners.current.get(channel)!.add(callback);

    // Initial subscription if it already exists
    if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }

    return () => {
      const channelListeners = listeners.current.get(channel);
      if (channelListeners) {
        channelListeners.delete(callback);
        if (channelListeners.size === 0) {
          listeners.current.delete(channel);
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'unsubscribe', channel }));
          }
        }
      }
    };
  }, []);

  const send = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  return { isConnected, error, subscribe, send };
}
