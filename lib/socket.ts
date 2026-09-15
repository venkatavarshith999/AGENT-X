import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function getSocket(): Socket {
  if (!socket) {
    if (typeof window !== 'undefined' && (!API_BASE_URL || API_BASE_URL.startsWith('/'))) {
      socket = io(window.location.origin, {
        autoConnect: false,
        transports: ['polling'],
      });
    } else {
      socket = io(API_BASE_URL || 'http://localhost:4000', {
        autoConnect: false,
      });
    }
  }
  return socket;
}
