import { Order } from './order.types';

// Socket event names
export const SOCKET_EVENTS = {
  // Student events
  ORDER_PLACED: 'order:placed',
  ORDER_STATUS_UPDATED: 'order:status_updated',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',

  // Staff events
  NEW_ORDER: 'new_order',

  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
} as const;

/** Union of every socket event name on the wire (e.g. 'new_order'). */
export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// Socket event payloads. Every order event carries the full order so any open
// screen can update its cache directly, without a follow-up fetch.
export interface OrderPlacedPayload {
  order: Order;
}

export interface OrderStatusUpdatedPayload {
  order: Order;
}

export interface NewOrderPayload {
  order: Order;
}

export interface JoinRoomPayload {
  room: string; // canteenId or userId
}
