"use client";

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { useOrderBookStore } from '@/hooks/useOrderBook';
import { useTransactionStore } from '@/hooks/useTransactions';
import config from '@/lib/config';

export function RealTimeManager() {
  const { token } = useAuth();
  const { isConnected, subscribe } = useWebSocket(config.api.wsUrl, token);
  
  const { addOrder, updateOrder, removeOrder } = useOrderBookStore();
  const { updateTransaction } = useTransactionStore();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to order book updates
    const unsubscribeOrders = subscribe('orders', (data) => {
      console.log('Real-time order update:', data);
      
      if (data.status === 'open') {
        addOrder(data);
      } else if (data.status === 'filled' || data.status === 'matched') {
        updateOrder(data.id, data);
      } else if (data.status === 'cancelled') {
        removeOrder(data.id);
      }
    });

    return () => {
      unsubscribeOrders();
    };
  }, [isConnected, subscribe, addOrder, updateOrder, removeOrder]);

  return null; // This component doesn't render anything
}
