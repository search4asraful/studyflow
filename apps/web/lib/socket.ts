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

/**
 * Measures round-trip latency to the Socket.IO server in milliseconds.
 * Returns null if the socket is disconnected or timed out.
 */
export function measureSocketPing(): Promise<number | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const s = getSocket();
  if (!s || !s.connected) return Promise.resolve(null);

  return new Promise((resolve) => {
    const start = performance.now();
    const timeout = setTimeout(() => resolve(null), 3000);

    try {
      s.emit('studyflow:ping', (res: any) => {
        clearTimeout(timeout);
        if (res?.ok) {
          const rtt = Math.max(1, Math.round(performance.now() - start));
          resolve(rtt);
        } else {
          resolve(null);
        }
      });
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}
