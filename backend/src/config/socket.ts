import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '../../../shared/src/types/socket.types';
import User from '../models/User.model';
import type { IOrder } from '../models/Order.model';

interface SocketUser {
  userId: string;
  role: string;
}

// Held at module scope so controllers can emit via the helpers below without
// importing the server (which would create a circular dependency).
let ioInstance: SocketIOServer | null = null;

const userRoom = (userId: string): string => `user:${userId}`;
const canteenRoom = (canteenId: string): string => `canteen:${canteenId}`;

export const initializeSocket = (io: SocketIOServer): void => {
  ioInstance = io;

  // Authenticate every socket from its JWT before any events flow.
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as SocketUser;

    // Everyone listens on their own room for updates to their orders.
    socket.join(userRoom(user.userId));

    // Staff/owner additionally listen on their canteen's live feed. The room is
    // resolved from the DB server-side — never from client input — so a user
    // can only ever subscribe to the canteen they actually belong to.
    if (user.role === 'staff' || user.role === 'owner') {
      try {
        const me = await User.findById(user.userId).select('canteenId');
        if (me?.canteenId) {
          socket.join(canteenRoom(me.canteenId.toString()));
        }
      } catch {
        // A failed lookup just means no canteen feed; personal room still works.
      }
    }

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      /* no cleanup needed — socket.io leaves rooms automatically */
    });
  });

  console.log('✅ Socket.io initialized');
};

/**
 * Push a freshly-placed order to its canteen's staff/owner in real time.
 * Delivery PIN is stripped before emitting to the canteen room so staff
 * runners cannot inspect socket frames to obtain the code early.
 */
export const emitNewOrder = (order: IOrder): void => {
  if (!ioInstance) return;
  const sanitized =
    order && typeof (order as any).toObject === 'function'
      ? (order as any).toObject()
      : { ...order };
  delete sanitized.deliveryPin;
  ioInstance.to(canteenRoom(order.canteenId.toString())).emit(SOCKET_EVENTS.NEW_ORDER, { order: sanitized });
};

/**
 * Push an order status change to both the student who placed it and the
 * canteen working it, so every open screen updates without a refresh.
 * The student receives their full order (with PIN), while the canteen receives
 * the sanitized copy without deliveryPin.
 */
export const emitOrderStatusUpdate = (order: IOrder): void => {
  if (!ioInstance) return;
  const event =
    order.status === 'cancelled' ? SOCKET_EVENTS.ORDER_CANCELLED : SOCKET_EVENTS.ORDER_STATUS_UPDATED;
  const studentOrder =
    order && typeof (order as any).toObject === 'function'
      ? (order as any).toObject()
      : { ...order };
  const canteenOrder = { ...studentOrder };
  delete canteenOrder.deliveryPin;

  ioInstance.to(userRoom(order.studentId.toString())).emit(event, { order: studentOrder });
  ioInstance.to(canteenRoom(order.canteenId.toString())).emit(event, { order: canteenOrder });
};
