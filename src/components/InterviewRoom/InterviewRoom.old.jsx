import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Camera, CameraOff, Send, Wifi, WifiOff, Clock, Volume2, AlertCircle, CheckCircle } from 'lucide-react';

const InterviewRoom = () => {
  // State Management
  const [interviewState, setInterviewState] = useState('CONNECTING');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const recordedChunksRef = useRef([]);
  const silenceTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Replace with your actual WebSocket server URL
        socketRef.current = new WebSocket('wss://your-server.com/interview');
        
        socketRef.current.onopen = () => {
          setConnectionStatus('connected');
          setInterviewState('WAITING');
          console.log('WebSocket connected');
        };

        socketRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'audio_chunk':
              handleIncomingAudio(data.audio);
              break;
            case 'interview_started':
              setInterviewState('AI_SPEAKING');
              setCurrentQuestion(1);
              startTimer();
              break;
            case 'interview_ended':
              handleInterviewEnd(data);
              break;
            case 'error':
              setErrorMessage(data.message);
              break;
            default:
              break;
          }
        };

        socketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('error');
          setErrorMessage('Connection error. Please refresh and try again.');
        };

        socketRef.current.onclose = () => {
          setConnectionStatus('disconnected');
          console.log('WebSocket disconnected');
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize audio context and analyser
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        audioAnalyserRef.current = audioContextRef.current.createAnalyser();
        audioAnalyserRef.current.fftSize = 256;
        source.connect(audioAnalyserRef.current);

        // Start monitoring audio levels
        monitorAudioLevels();
      } catch (error) {
        console.error('Failed to access camera/microphone:', error);
        setErrorMessage('Please allow camera and microphone access to continue.');
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && interviewState !== 'ENDED') {
        setShowTabWarning(true);
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ 
            type: 'tab_switched',
            timestamp: Date.now()
          }));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interviewState]);

  // Timer management
  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Audio level monitoring
  const monitorAudioLevels = () => {
    if (!audioAnalyserRef.current) return;

    const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
    
    const checkLevel = () => {
      audioAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);

      if (isRecording && average < 10) {
        handleSilenceDetection();
      } else if (isRecording && average >= 10) {
        resetSilenceTimer();
      }

      requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  };

  // Handle incoming audio from server
  const handleIncomingAudio = async (audioData) => {
    setInterviewState('AI_SPEAKING');
    setIsMicEnabled(false);
    isPlayingRef.current = true;

    try {
      // Convert base64 to audio and play
      const audioBlob = base64ToBlob(audioData, 'audio/webm');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        isPlayingRef.current = false;
        setInterviewState('USER_RESPONDING');
        setIsMicEnabled(true);
        startRecording();
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setInterviewState('USER_RESPONDING');
      setIsMicEnabled(true);
    }
  };

  // Recording functions
  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

    try {
      const audioTracks = streamRef.current.getAudioTracks();
      const audioStream = new MediaStream(audioTracks);
      
      mediaRecorderRef.current = new MediaRecorder(audioStream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setSilenceTimer(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage('Failed to start recording. Please check your microphone.');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        sendAudioToServer(audioBlob);
        recordedChunksRef.current = [];
      };
    }
  }, [isRecording]);

  // Send audio to server
  const sendAudioToServer = async (audioBlob) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMessage('Connection lost. Please refresh the page.');
      return;
    }

    setInterviewState('PROCESSING');
    
    try {
      const base64Audio = await blobToBase64(audioBlob);
      socketRef.current.send(JSON.stringify({
        type: 'audio_response',
        audio: base64Audio,
        questionNumber: currentQuestion,
        timestamp: Date.now()
      }));
      
      setCurrentQuestion(prev => prev + 1);
    } catch (error) {
      console.error('Failed to send audio:', error);
      setErrorMessage('Failed to send response. Please try again.');
      setInterviewState('USER_RESPONDING');
    }
  };

  // Silence detection
  const handleSilenceDetection = () => {
    setSilenceTimer(prev => {
      const newTimer = prev + 1;
      
      if (newTimer >= 20 && isRecording) {
        stopRecording();
      }
      
      return newTimer;
    });
  };

  const resetSilenceTimer = () => {
    setSilenceTimer(0);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  };

  // Handle interview end
  const handleInterviewEnd = (data) => {
    setInterviewState('ENDED');
    stopTimer();
    stopRecording();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Utility functions
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const handleSendClick = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const resumeInterview = () => {
    setShowTabWarning(false);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'resume_interview',
        timestamp: Date.now()
      }));
    }
  };

  // Render AI Avatar Animation
  const renderAIAvatar = () => {
    const isAISpeaking = interviewState === 'AI_SPEAKING';
    
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="relative">
          {/* Avatar Circle */}
          <div className={`w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center transition-all duration-300 ${
            isAISpeaking ? 'scale-110' : 'scale-100'
          }`}>
            <div className="text-white text-4xl font-bold">AI</div>
          </div>
          
          {/* Speaking Animation */}
          {isAISpeaking && (
            <>
              <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <Volume2 className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
            </>
          )}
          
          {/* Listening Animation */}
          {interviewState === 'USER_RESPONDING' && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 text-sm text-gray-600">
          {isAISpeaking ? 'AI is speaking...' : 'AI is listening...'}
        </div>
      </div>
    );
  };

  // Main render
  if (interviewState === 'ENDED') {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Interview Completed!</h2>
          <p className="text-gray-600 mb-4">
            Great job! You've completed the interview.
          </p>
          <div className="space-y-2 text-left bg-gray-50 rounded p-4">
            <p className="text-sm"><span className="font-semibold">Duration:</span> {formatTime(elapsedTime)}</p>
            <p className="text-sm"><span className="font-semibold">Questions answered:</span> {currentQuestion}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold text-lg">Mock Interview</h1>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm ${
              connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'
            }`}>
              {connectionStatus}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-white text-sm">
            Question #{currentQuestion}
          </div>
          <div className="flex items-center space-x-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* AI Avatar Side */}
        <div className="flex-1 relative">
          {renderAIAvatar()}
        </div>

        {/* User Video Side */}
        <div className="flex-1 relative bg-gray-800">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
          />
          
          {!isCameraOn && (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-400">
                <CameraOff className="w-16 h-16 mx-auto mb-4" />
                <p>Camera is off</p>
              </div>
            </div>
          )}
          
          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            {isCameraOn ? (
              <Camera className="w-5 h-5 text-white" />
            ) : (
              <CameraOff className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Camera Status */}
          {isCameraOn && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 rounded-full">
              <span className="text-xs text-white font-medium">Camera On</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center px-6">
        <div className="flex items-center space-x-6">
          {/* Recording Status */}
          <div className="flex items-center space-x-3">
            {isRecording ? (
              <>
                <div className="relative">
                  <Mic className="w-6 h-6 text-red-500 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-white text-sm">Recording...</span>
                {silenceTimer > 0 && (
                  <span className="text-gray-400 text-xs">
                    (Auto-send in {20 - silenceTimer}s)
                  </span>
                )}
              </>
            ) : (
              <>
                <MicOff className="w-6 h-6 text-gray-400" />
                <span className="text-gray-400 text-sm">
                  {isMicEnabled ? 'Ready to record' : 'Mic disabled'}
                </span>
              </>
            )}
          </div>

          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 transition-all duration-100 ${
                    audioLevel > i * 50 ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                  style={{ height: `${8 + i * 4}px` }}
                />
              ))}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendClick}
            disabled={!isRecording || interviewState === 'PROCESSING'}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition ${
              isRecording && interviewState !== 'PROCESSING'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Response</span>
          </button>
        </div>

        {/* State Indicator */}
        <div className="absolute right-6">
          <span className="text-xs text-gray-400">
            Status: {interviewState}
          </span>
        </div>
      </footer>

      {/* Error Message */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-2">Interview Paused</h3>
            <p className="text-gray-600 mb-4">
              You switched to another tab. The interview has been paused.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={resumeInterview}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Resume Interview
              </button>
              <button
                onClick={() => handleInterviewEnd({})}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;