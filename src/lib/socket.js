import { io } from 'socket.io-client';

let socket = null;
let isConnected = false;

export const connectSocket = (serverUrl = 'http://localhost:8000') => {
  if (!socket) {
    socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: false
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => isConnected;

// Interview-specific functions
export const joinInterview = (sessionId) => {
  if (socket && socket.connected) {
    socket.emit('joinInterview', { sessionId });
  }
};

export const sendCompleteResponse = (data) => {
  if (socket && socket.connected) {
    socket.emit('completeResponse', data);
  }
};

// Event handlers
export const onSocketEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

export const offSocketEvent = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
  }
};

// Setup backend state tracking
export const setupBackendStateTracking = () => {
  if (socket) {
    socket.on('connect', () => {
      isConnected = true;
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      isConnected = false;
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      isConnected = false;
      console.error('Socket connection error:', error);
    });
  }
};

// Utility function to reset all states
export const resetSocketStates = () => {
  isConnected = false;
};
