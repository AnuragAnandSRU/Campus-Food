'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { initializeSocket } from '@/lib/socket';
import type { SocketEventName } from '../../shared/src/types/socket.types';
import type { Order } from '../../shared/src/types/order.types';

// The events the client listens for. Kept as local literals because the shared
// module is consumed type-only from the frontend (Turbopack won't bundle TS
// source from outside the app root, and shared is imported by relative path,
// not as a built package). Typing each to SocketEventName ties it to the shared
// contract, so a renamed or removed event fails to compile here.
const NEW_ORDER: SocketEventName = 'new_order';
const ORDER_STATUS_UPDATED: SocketEventName = 'order:status_updated';
const ORDER_CANCELLED: SocketEventName = 'order:cancelled';

interface OrderSocketHandlers {
  onNewOrder?: (order: Order) => void;
  onStatusUpdate?: (order: Order) => void;
}

/**
 * Subscribes to live order events over the shared socket for as long as the
 * component is mounted. Handlers are held in a ref so callers can pass inline
 * closures without forcing a reconnect every render. The socket is a
 * session-lived singleton (see lib/socket) — we only add/remove our listeners.
 */
export function useOrderSocket(handlers: OrderSocketHandlers): void {
  const token = useAuthStore((s) => s.token);
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!token) return;
    const socket = initializeSocket(token);

    const handleNew = (p: { order: Order }) => ref.current.onNewOrder?.(p.order);
    const handleStatus = (p: { order: Order }) => ref.current.onStatusUpdate?.(p.order);

    socket.on(NEW_ORDER, handleNew);
    socket.on(ORDER_STATUS_UPDATED, handleStatus);
    socket.on(ORDER_CANCELLED, handleStatus);

    return () => {
      socket.off(NEW_ORDER, handleNew);
      socket.off(ORDER_STATUS_UPDATED, handleStatus);
      socket.off(ORDER_CANCELLED, handleStatus);
    };
  }, [token]);
}
