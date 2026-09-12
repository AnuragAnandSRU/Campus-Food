import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import app from './app';
import { connectDB } from './config/database';
import { initializeSocket } from './config/socket';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Connect to database
connectDB();

// Initialize Socket.io
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});

export { io };
