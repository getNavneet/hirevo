import { useState, useEffect } from 'react';
import { joinInterview, sendCompleteResponse, onSocketEvent, offSocketEvent } from '../../../lib/socket';

export const useInterviewState = (socket, startRecording, stopRecording, playAudio, setError) => {
  const [interviewStatus, setInterviewStatus] = useState('joining');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcription, setTranscription] = useState('');
  const [partialTranscription, setPartialTranscription] = useState('');
  const [showSendButton, setShowSendButton] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleInterviewReady = async (data) => {
      setCurrentQuestion(data.question);
      setInterviewStatus('ready');
      await playAudio(data.audioData, () => startRecording());
    };

    const handleNextQuestion = async (data) => {
      setCurrentQuestion(data.question);
      setTranscription('');
      setPartialTranscription('');
      setShowSendButton(false);
      setInterviewStatus('ready');
      await playAudio(data.audioData, () => startRecording());
    };

    const handleSpeechStarted = () => {
      setShowSendButton(true);
      setInterviewStatus('listening');
    };

    const handlePartialTranscription = (data) => {
      setPartialTranscription(data.text);
    };

    const handleFinalTranscription = (data) => {
      setTranscription(prev => prev + ' ' + data.text);
      setPartialTranscription('');
    };

    const handleTranscriptionComplete = (data) => {
      setTranscription(data.text);
      setPartialTranscription('');
    };

    const handleInterviewComplete = () => {
      setInterviewStatus('complete');
      stopRecording();
    };

    const handleTranscriptionError = (message) => {
      setError('Speech recognition error: ' + message);
      stopRecording();
    };

    // Setup event listeners
    onSocketEvent('interviewReady', handleInterviewReady);
    onSocketEvent('nextQuestion', handleNextQuestion);
    onSocketEvent('interviewComplete', handleInterviewComplete);
    onSocketEvent('speechRecognitionStarted', handleSpeechStarted);
    onSocketEvent('partial-transcription', handlePartialTranscription);
    onSocketEvent('transcription', handleFinalTranscription);
    onSocketEvent('transcriptionComplete', handleTranscriptionComplete);
    onSocketEvent('transcription-error', handleTranscriptionError);

    // Join interview when socket is ready
    if (socket.connected) {
      joinInterview(sessionId);
    }

    return () => {
      offSocketEvent('interviewReady');
      offSocketEvent('nextQuestion');
      offSocketEvent('interviewComplete');
      offSocketEvent('speechRecognitionStarted');
      offSocketEvent('partial-transcription');
      offSocketEvent('transcription');
      offSocketEvent('transcriptionComplete');
      offSocketEvent('transcription-error');
    };
  }, [socket]);

  const handleSendResponse = () => {
    if (transcription.trim()) {
      sendCompleteResponse({ finalText: transcription.trim() });
      setShowSendButton(false);
      stopRecording();
      setInterviewStatus('processing');
    }
  };

  const getStatusMessage = () => {
    switch (interviewStatus) {
      case 'joining': return 'Joining interview...';
      case 'ready': return 'Playing question audio...';
      case 'listening': return 'Listening... Speak your answer';
      case 'processing': return 'Processing your response...';
      case 'complete': return 'Interview completed!';
      case 'error': return 'Error occurred';
      case 'disconnected': return 'Connection lost';
      default: return '';
    }
  };

  return {
    interviewStatus,
    setInterviewStatus,
    currentQuestion,
    transcription,
    partialTranscription,
    showSendButton,
    handleSendResponse,
    getStatusMessage
  };
};