import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const STT_SERVER_URL = 'http://localhost:8001'; // Your STT server

export const useSTTSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);

  useEffect(() => {
    // Connect to STT server
    socketRef.current = io(STT_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[STT] Connected to STT server');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[STT] Disconnected from STT server');
      setIsConnected(false);
    });

    socket.on('speechRecognitionStarted', () => {
      console.log('[STT] Speech recognition started');
      setIsRecognitionActive(true);
    });

    socket.on('partial-transcription', ({ text }) => {
      setPartialTranscript(text);
    });

    socket.on('transcription', ({ text }) => {
      setFinalTranscript(prev => prev + ' ' + text);
      setPartialTranscript('');
    });

    socket.on('transcriptionComplete', ({ text }) => {
      console.log('[STT] Transcription complete:', text);
    });

    socket.on('speechRecognitionStopped', () => {
      console.log('[STT] Speech recognition stopped');
      setIsRecognitionActive(false);
    });

    socket.on('transcription-error', (message) => {
      console.error('[STT] Error:', message);
      setError(message);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const startRecognition = useCallback(() => {
    if (socketRef.current && isConnected) {
      setFinalTranscript('');
      setPartialTranscript('');
      socketRef.current.emit('startSpeechRecognition');
    }
  }, [isConnected]);

  const stopRecognition = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stopSpeechRecognition');
    }
  }, [isConnected]);

  const sendAudioChunk = useCallback((audioData) => {
    if (socketRef.current && isConnected && isRecognitionActive) {
      socketRef.current.emit('audioChunk', audioData);
    }
  }, [isConnected, isRecognitionActive]);

  const resetTranscripts = useCallback(() => {
    setFinalTranscript('');
    setPartialTranscript('');
  }, []);

  return {
    isConnected,
    isRecognitionActive,
    partialTranscript,
    finalTranscript,
    error,
    startRecognition,
    stopRecognition,
    sendAudioChunk,
    resetTranscripts,
  };
};
