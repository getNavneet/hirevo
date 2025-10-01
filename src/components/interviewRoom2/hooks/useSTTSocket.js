import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const STT_SERVER_URL = 'http://localhost:8001';

export const useSTTSocket = () => {
  const socketRef = useRef(null);
  const isRecognitionActiveRef = useRef(false); // Use ref instead of only state
  const [isConnected, setIsConnected] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false); // Keep state for UI

  useEffect(() => {
    console.log('[STT] Initializing socket connection...');
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
      isRecognitionActiveRef.current = false;
      setIsRecognitionActive(false);
    });

    socket.on('speechRecognitionStarted', () => {
      console.log('[STT] Speech recognition started - setting active to true');
      isRecognitionActiveRef.current = true; // Update ref immediately
      setIsRecognitionActive(true); // Update state for UI
    });

    socket.on('partial-transcription', ({ text }) => {
      console.log('[STT] Partial:', text);
      setPartialTranscript(text);
    });

    socket.on('transcription', ({ text }) => {
      console.log('[STT] Final:', text);
      setFinalTranscript(prev => prev + ' ' + text);
      setPartialTranscript('');
    });

    socket.on('transcriptionComplete', ({ text }) => {
      console.log('[STT] Transcription complete:', text);
    });

    socket.on('speechRecognitionStopped', () => {
      console.log('[STT] Speech recognition stopped');
      isRecognitionActiveRef.current = false;
      setIsRecognitionActive(false);
    });

    socket.on('transcription-error', (message) => {
      console.error('[STT] Error:', message);
      setError(message);
      isRecognitionActiveRef.current = false;
      setIsRecognitionActive(false);
    });

    return () => {
      console.log('[STT] Cleaning up socket connection');
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const startRecognition = useCallback(() => {
    if (socketRef.current && isConnected) {
      console.log('[STT] Starting speech recognition');
      setFinalTranscript('');
      setPartialTranscript('');
      setError(null);
      socketRef.current.emit('startSpeechRecognition');
    } else {
      console.warn('[STT] Cannot start - not connected');
    }
  }, [isConnected]);

  const stopRecognition = useCallback(() => {
    if (socketRef.current && isConnected) {
      console.log('[STT] Stopping speech recognition');
      socketRef.current.emit('stopSpeechRecognition');
      isRecognitionActiveRef.current = false;
      setIsRecognitionActive(false);
    }
  }, [isConnected]);

  const sendAudioChunk = useCallback((audioData) => {
    // Use ref instead of state in the check
    if (socketRef.current && isConnected && isRecognitionActiveRef.current) {
      socketRef.current.emit('audioChunk', audioData);
    } else {
      if (!isConnected) {
        console.warn('[STT] Cannot send audio - not connected');
      } else if (!isRecognitionActiveRef.current) {
        console.warn('[STT] Cannot send audio - recognition not active (ref check)');
      }
    }
  }, [isConnected]); // Remove isRecognitionActive from dependencies

  const resetTranscripts = useCallback(() => {
    console.log('[STT] Resetting transcripts');
    setFinalTranscript('');
    setPartialTranscript('');
  }, []);

  return {
    isConnected,
    isRecognitionActive, // State for UI
    partialTranscript,
    finalTranscript,
    error,
    startRecognition,
    stopRecognition,
    sendAudioChunk,
    resetTranscripts,
  };
};
