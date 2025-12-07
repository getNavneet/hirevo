import React, { useState, useEffect, useRef } from 'react';
import { 
  connectSocket, 
  disconnectSocket, 
  joinInterview, 
  sendCompleteResponse,
  onSocketEvent,
  offSocketEvent,
  setupBackendStateTracking 
} from '../../lib/socket';

const InterviewRoom = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [partialTranscription, setPartialTranscription] = useState('');
  const [showSendButton, setShowSendButton] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState('joining'); // joining, ready, listening, processing, complete
  const [error, setError] = useState('');
  
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    initializeSocket();
    return () => {
      cleanup();
    };
  }, []);

  const initializeSocket = () => {
    const socketInstance = connectSocket('http://localhost:8000');
    setSocket(socketInstance);
    setupBackendStateTracking();
    setupSocketEventHandlers(socketInstance);
    socketInstance.connect();
  };

  const setupSocketEventHandlers = () => {
    // Connection events
    onSocketEvent('connect', () => {
      setIsConnected(true);
      setError('');
      joinInterview(sessionId);
    });

    onSocketEvent('disconnect', () => {
      setIsConnected(false);
      setInterviewStatus('disconnected');
    });

    // Interview events
    onSocketEvent('interviewReady', handleInterviewReady);
    onSocketEvent('nextQuestion', handleNextQuestion);
    onSocketEvent('interviewComplete', handleInterviewComplete);
    
    // Speech recognition events
    onSocketEvent('speechRecognitionStarted', handleSpeechStarted);
    onSocketEvent('partial-transcription', handlePartialTranscription);
    onSocketEvent('transcription', handleFinalTranscription);
    onSocketEvent('transcriptionComplete', handleTranscriptionComplete);
    onSocketEvent('speechRecognitionStopped', handleSpeechStopped);
    
    // Error events
    onSocketEvent('error', handleError);
    onSocketEvent('transcription-error', handleTranscriptionError);
  };

  const handleInterviewReady = async (data) => {
    setCurrentQuestion(data.question);
    setInterviewStatus('ready');
    await playQuestionAudio(data.audioData);
  };

  const handleNextQuestion = async (data) => {
    setCurrentQuestion(data.question);
    setTranscription('');
    setPartialTranscription('');
    setShowSendButton(false);
    setInterviewStatus('ready');
    await playQuestionAudio(data.audioData);
  };

  const playQuestionAudio = async (audioData) => {
    try {
      setAudioPlaying(true);
      
      // Convert base64 to audio blob
      const audioBlob = new Blob([
        new Uint8Array(atob(audioData).split('').map(char => char.charCodeAt(0)))
      ], { type: 'audio/wav' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        
        audioRef.current.onended = () => {
          setAudioPlaying(false);
          URL.revokeObjectURL(audioUrl);
          // Automatically start mic after audio finishes
          startMicRecording();
        };
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioPlaying(false);
      // Start mic even if audio fails
      startMicRecording();
    }
  };

  const startMicRecording = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Start socket speech recognition
      socket.emit('startSpeechRecognition');
      
      // Create MediaRecorder for audio chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          // Convert audio data to array buffer and send
          event.data.arrayBuffer().then(arrayBuffer => {
            const uint8Array = new Uint8Array(arrayBuffer);
            socket.emit('audioChunk', uint8Array);
          });
        }
      };
      
      // Start recording in small chunks
      mediaRecorder.start(100); // Send data every 100ms
      setInterviewStatus('listening');
      
    } catch (error) {
      console.error('Error starting microphone:', error);
      setError('Failed to access microphone');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (socket) {
      socket.emit('stopSpeechRecognition');
    }
    
    setMicActive(false);
    setInterviewStatus('processing');
  };

  const handleSpeechStarted = () => {
    setMicActive(true);
    setShowSendButton(true);
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

  const handleSpeechStopped = () => {
    setMicActive(false);
  };

  const handleSendResponse = () => {
    if (transcription.trim()) {
      sendCompleteResponse({ finalText: transcription.trim() });
      setShowSendButton(false);
      stopMicRecording();
      setInterviewStatus('processing');
    }
  };

  const handleInterviewComplete = (data) => {
    setInterviewStatus('complete');
    stopMicRecording();
  };

  const handleError = (data) => {
    setError(data.message);
    setInterviewStatus('error');
  };

  const handleTranscriptionError = (message) => {
    setError('Speech recognition error: ' + message);
    stopMicRecording();
  };

  const cleanup = () => {
    stopMicRecording();
    
    // Remove all event listeners
    if (socket) {
      offSocketEvent('connect');
      offSocketEvent('disconnect');
      offSocketEvent('interviewReady');
      offSocketEvent('nextQuestion');
      offSocketEvent('interviewComplete');
      offSocketEvent('speechRecognitionStarted');
      offSocketEvent('partial-transcription');
      offSocketEvent('transcription');
      offSocketEvent('transcriptionComplete');
      offSocketEvent('speechRecognitionStopped');
      offSocketEvent('error');
      offSocketEvent('transcription-error');
    }
    
    disconnectSocket();
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

  return (
    <div className="interview-room">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="interview-header">
        <h1>AI Interview Session</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Status */}
      <div className="status-section">
        <div className="status-message">
          {getStatusMessage()}
        </div>
        {audioPlaying && <div className="audio-indicator">🔊 Playing question...</div>}
        {micActive && <div className="mic-indicator">🎤 Recording...</div>}
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="question-section">
          <h3>Current Question:</h3>
          <p className="question-text">{currentQuestion}</p>
        </div>
      )}

      {/* Transcription */}
      {(transcription || partialTranscription) && (
        <div className="transcription-section">
          <h3>Your Response:</h3>
          <div className="transcription-text">
            <span className="final-text">{transcription}</span>
            {partialTranscription && (
              <span className="partial-text"> {partialTranscription}</span>
            )}
          </div>
        </div>
      )}

      {/* Send Button */}
      {showSendButton && transcription && (
        <div className="controls-section">
          <button 
            className="send-button"
            onClick={handleSendResponse}
            disabled={!transcription.trim() || interviewStatus === 'processing'}
          >
            Send Response & Next Question
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-section">
          <p className="error-message">⚠️ {error}</p>
        </div>
      )}

      {/* Interview Complete */}
      {interviewStatus === 'complete' && (
        <div className="completion-section">
          <h2>🎉 Interview Completed!</h2>
          <p>Thank you for participating in the AI interview.</p>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
