import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  // If the socket was already connected under a different token (e.g. account switch),
  // disconnect it first so the new socket authenticates with the current user.
  if (socket && (socket.auth as Record<string, unknown>)?.token !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinRoom = (room: string): void => {
  if (socket) {
    socket.emit('join_room', { room });
  }
};

export const leaveRoom = (room: string): void => {
  if (socket) {
    socket.emit('leave_room', { room });
  }
};
