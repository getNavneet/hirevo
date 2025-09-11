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

export const sendAudioChunk = (audioData) => {
  if (socket && socket.connected ) {
    socket.emit('audioChunk', audioData);
  } else {
    console.log('Skipping audio chunk - backend not recording or socket disconnected');
  }
};

export const sendCompleteResponse = (data) => {
  if (socket && socket.connected) {
    socket.emit('completeResponse', data);
  }
};

export const startSpeechRecognition = () => {
  if (socket && socket.connected) {
    console.log('Starting speech recognition...');
   
    socket.emit('startSpeechRecognition');
  }  else {
    console.log('Socket not connected, cannot start speech recognition');
  }
};

export const stopSpeechRecognition = () => {
  if (socket && socket.connected ) {
    console.log('Stopping speech recognition...');
    socket.emit('stopSpeechRecognition');
  } else {
    console.log('Socket not connected, cannot stop speech recognition');
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
