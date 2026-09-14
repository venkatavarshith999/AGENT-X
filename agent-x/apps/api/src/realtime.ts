import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initRealtime(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join', (room: string) => {
      socket.join(room);
      // console.log(`[Socket] Client ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastEvent(event: string, payload: any) {
  if (io) {
    io.emit(event, payload);
  }
}
