import { io, Socket } from 'socket.io-client';
import { API_URL } from './env';
import { authStorage } from './authStorage';

let socket: Socket | null = null;
let connectScheduled = false;
let hasConnectedOnce = false;

const CONNECT_TIMEOUT_MS = 4000;
const IDLE_CONNECT_TIMEOUT_MS = 2000;
const isDevelopment = process.env.NODE_ENV !== 'production';

type SocketConnectMode = 'idle' | 'immediate';

const scheduleSocketConnect = (mode: SocketConnectMode) => {
  if (connectScheduled) return;
  connectScheduled = true;

  const connect = () => {
    connectScheduled = false;
    if (!socket) return;
    if (socket.connected || socket.active) return;
    socket.connect();
  };

  if (mode === 'immediate') {
    setTimeout(connect, 0);
    return;
  }

  type BrowserGlobals = {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void;
    addEventListener?: (type: "load", listener: () => void, options?: { once?: boolean }) => void;
    document?: { readyState?: string };
  };

  const browserGlobals: BrowserGlobals | null =
    typeof globalThis === "undefined" ? null : (globalThis as BrowserGlobals);

  if (!browserGlobals?.document || typeof browserGlobals.addEventListener !== "function") {
    connect();
    return;
  }

  if (typeof browserGlobals.requestIdleCallback === "function") {
    browserGlobals.requestIdleCallback(connect, { timeout: IDLE_CONNECT_TIMEOUT_MS });
    return;
  }

  if (browserGlobals.document.readyState === "complete") {
    setTimeout(connect, 0);
  } else {
    browserGlobals.addEventListener("load", connect, { once: true });
  }
};

export const getSocket = (options?: { connect?: SocketConnectMode }): Socket => {
  if (!socket) {
    const token = authStorage.getAccessToken();

    socket = io(API_URL, {
      transports: isDevelopment ? ['polling'] : ['polling', 'websocket'],
      upgrade: !isDevelopment,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: CONNECT_TIMEOUT_MS,
      auth: {
        token: token || undefined,
      },
    });

    socket.on('connect', () => {
      hasConnectedOnce = true;
      console.log('🔌 Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      if (!hasConnectedOnce && (error as Error)?.message === 'timeout') {
        console.warn('🟠 WebSocket connection timeout (will retry):', error);
        return;
      }
      console.error('🔴 WebSocket connection error:', error);
    });
  }

  scheduleSocketConnect(options?.connect ?? 'idle');
  return socket;
};

/**
 * Update socket authentication token
 * Call this after token refresh to update the socket connection
 */
export const updateSocketToken = (newToken: string) => {
  if (socket && socket.connected) {
    // Update the auth token for future reconnections
    socket.auth = { token: newToken };

    // Disconnect and reconnect to apply new token
    socket.disconnect();
    socket.connect();

    console.log('🔄 Socket token updated and reconnected');
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Reconnect socket with new token (call after login/logout)
export const reconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket({ connect: 'immediate' });
};

export default getSocket;
