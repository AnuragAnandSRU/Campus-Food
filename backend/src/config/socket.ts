import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '../../../shared/src/types/socket.types';

interface SocketUser {
  userId: string;
  role: string;
}

export const initializeSocket = (io: SocketIOServer): void => {
  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`✅ User connected: ${user.userId} (${user.role})`);

    // Join user-specific room
    socket.join(`user:${user.userId}`);

    // Handle room joining (for canteen staff)
    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ room }: { room: string }) => {
      socket.join(room);
      console.log(`👤 User ${user.userId} joined room: ${room}`);
    });

    // Handle leaving room
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ room }: { room: string }) => {
      socket.leave(room);
      console.log(`👋 User ${user.userId} left room: ${room}`);
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`❌ User disconnected: ${user.userId}`);
    });
  });

  console.log('✅ Socket.io initialized');
};

// Export io instance for use in other files
let ioInstance: SocketIOServer;

export const setSocketInstance = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getSocketInstance = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};
