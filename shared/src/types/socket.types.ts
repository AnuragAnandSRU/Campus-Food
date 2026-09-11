import { Order, OrderStatus } from './order.types';

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

// Socket event payloads
export interface OrderPlacedPayload {
  order: Order;
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  status: OrderStatus;
  estimatedDeliveryTime?: Date;
}

export interface NewOrderPayload {
  order: Order;
  canteenId: string;
}

export interface JoinRoomPayload {
  room: string; // canteenId or userId
}
