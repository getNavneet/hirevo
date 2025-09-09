// lib/socket.js
import { io } from 'socket.io-client';

let socket = null;
let isConnected = false;
let isBackendRecording = false;

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
    isBackendRecording = false;
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

export const startSpeechRecognition = () => {
  if (socket && socket.connected && !isBackendRecording) {
    console.log('Starting speech recognition...');
    isBackendRecording = true;
    socket.emit('startSpeechRecognition');
  } else if (isBackendRecording) {
    console.log('Speech recognition already active');
  } else {
    console.log('Socket not connected, cannot start speech recognition');
  }
};

export const stopSpeechRecognition = () => {
  if (socket && socket.connected && isBackendRecording) {
    console.log('Stopping speech recognition...');
    isBackendRecording = false;
    socket.emit('stopSpeechRecognition');
  } else if (!isBackendRecording) {
    console.log('Speech recognition not active');
  } else {
    console.log('Socket not connected, cannot stop speech recognition');
  }
};

export const sendAudioChunk = (audioData) => {
  if (socket && socket.connected && isBackendRecording) {
    socket.emit('audioChunk', audioData);
  } else {
    console.log('Skipping audio chunk - backend not recording or socket disconnected');
  }
};

export const sendCompleteResponse = (finalText) => {
  if (socket && socket.connected) {
    socket.emit('completeResponse', { finalText });
  }
};

export const isRecordingActive = () => isBackendRecording;

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
      isBackendRecording = false;
      console.log('Socket disconnected');
    });

    socket.on('speechRecognitionStarted', () => {
      isBackendRecording = true;
      console.log('Backend confirmed speech recognition started');
    });

    socket.on('speechRecognitionStopped', () => {
      isBackendRecording = false;
      console.log('Backend confirmed speech recognition stopped');
    });

    socket.on('connect_error', (error) => {
      isConnected = false;
      isBackendRecording = false;
      console.error('Socket connection error:', error);
    });
  }
};

// Utility function to reset all states
export const resetSocketStates = () => {
  isConnected = false;
  isBackendRecording = false;
};
