import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const INTERVIEW_SERVER_URL = 'http://localhost:8000'; // Your interview server

export const useInterviewSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionAudio, setQuestionAudio] = useState(null);
  const [interviewStatus, setInterviewStatus] = useState('idle'); // idle, ready, active, complete
  const [error, setError] = useState(null);

  useEffect(() => {
    socketRef.current = io(INTERVIEW_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Interview] Connected to interview server');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[Interview] Disconnected from interview server');
      setIsConnected(false);
    });

    socket.on('interviewReady', ({ sessionId, question, audioData }) => {
      console.log('[Interview] Interview ready');
      setSessionId(sessionId);
      setCurrentQuestion(question);
      setQuestionAudio(audioData);
      setInterviewStatus('active');
    });

    socket.on('nextQuestion', ({ question, audioData }) => {
      console.log('[Interview] Next question received');
      setCurrentQuestion(question);
      setQuestionAudio(audioData);
    });

    socket.on('interviewComplete', ({ message }) => {
      console.log('[Interview] Interview complete');
      setCurrentQuestion(message);
      setInterviewStatus('complete');
    });

    socket.on('error', ({ message }) => {
      console.error('[Interview] Error:', message);
      setError(message);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinInterview = useCallback((sessionId) => {
    if (socketRef.current && isConnected) {
      console.log('[Interview] Joining interview:', sessionId);
      socketRef.current.emit('joinInterview', { sessionId });
      setInterviewStatus('joining');
    }
  }, [isConnected]);

  const sendCompleteResponse = useCallback((finalText) => {
    if (socketRef.current && isConnected) {
      console.log('[Interview] Sending complete response');
      socketRef.current.emit('completeResponse', { finalText });
    }
  }, [isConnected]);

  return {
    isConnected,
    sessionId,
    currentQuestion,
    questionAudio,
    interviewStatus,
    error,
    joinInterview,
    sendCompleteResponse,
  };
};
