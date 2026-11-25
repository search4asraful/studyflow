import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('studyflow:socket-connected'));
      }
    });

    socket.on('disconnect', (_reason) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('studyflow:socket-disconnected'));
      }
    });

    socket.on('connect_error', () => {
      // Handled silently without console exposure
    });
  }

  return socket;
}

/**
 * Disconnect socket when tab is superseded or backgrounded.
 * Frees precious memory and socket handles on single-core <100MB RAM server.
 */
export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Reconnect socket when tab becomes active again.
 */
export function reconnectSocket(): void {
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studyflow:socket-reconnected'));
    }
  }
}
