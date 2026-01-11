import { io, Socket } from 'socket.io-client';
import { API_URL } from './env';
import { authStorage } from './authStorage';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = authStorage.getAccessToken();

    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: token || undefined,
      },
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
    });
  }

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
  return getSocket();
};

export default getSocket;
