import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Send,
  Wifi,
  WifiOff,
  Clock,
  Volume2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  getSocket,
  onSocketEvent,
  offSocketEvent,
  sendCompleteResponse,
  disconnectSocket,
} from "../../lib/socket";

const InterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, firstQuestion, firstAudio } = location.state || {};

  // State Management
  const [interviewState, setInterviewState] = useState("CONNECTING");
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const isPlayingRef = useRef(false);
  const speechRecognitionRef = useRef(null); // New ref for Web Speech API

  // Redirect if no session data
  useEffect(() => {
    if (!sessionId) {
      navigate("/getStarted");
      return;
    }
  }, [sessionId, navigate]);

  // Initialize Socket.IO event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Connection status
    const handleConnect = () => {
      setConnectionStatus("connected");
      setInterviewState("AI_SPEAKING");
      console.log("Socket connected");
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      console.log("Socket disconnected");
    };

    const handleConnectError = (error) => {
      setConnectionStatus("error");
      setErrorMessage("Connection error. Please refresh and try again.");
    };

    // Interview events
    const handleInterviewReady = (data) => {
      console.log("Interview ready:", data);
      setCurrentQuestionText(data.question);
      if (data.audioData) {
        playAudioFromBase64(data.audioData);
      }
    };

    const handleNextQuestion = (data) => {
      console.log("Next question received:", data);
      setCurrentQuestion((prev) => prev + 1);
      setCurrentQuestionText(data.question);
      setInterviewState("AI_SPEAKING");
      if (data.audioData) {
        playAudioFromBase64(data.audioData);
      }
    };

    const handleInterviewComplete = (data) => {
      console.log("Interview completed:", data);
      handleInterviewEnd();
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
      setErrorMessage(error.message || "An error occurred");
    };

    // Register event listeners
    onSocketEvent("connect", handleConnect);
    onSocketEvent("disconnect", handleDisconnect);
    onSocketEvent("connect_error", handleConnectError);
    onSocketEvent("interviewReady", handleInterviewReady);
    onSocketEvent("nextQuestion", handleNextQuestion);
    onSocketEvent("interviewComplete", handleInterviewComplete);
    onSocketEvent("error", handleError);

    // Play first question if available
    if (firstQuestion && firstAudio) {
      setCurrentQuestionText(firstQuestion);
      playAudioFromBase64(firstAudio);
    }

    // Cleanup function
    return () => {
      offSocketEvent("connect", handleConnect);
      offSocketEvent("disconnect", handleDisconnect);
      offSocketEvent("connect_error", handleConnectError);
      offSocketEvent("interviewReady", handleInterviewReady);
      offSocketEvent("nextQuestion", handleNextQuestion);
      offSocketEvent("interviewComplete", handleInterviewComplete);
      offSocketEvent("error", handleError);
    };
  }, [firstQuestion, firstAudio]);

  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
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

        monitorAudioLevels();
      } catch (error) {
        console.error("Failed to access camera/microphone:", error);
        setErrorMessage("Please allow camera and microphone access to continue.");
      }
    };

    initMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Play audio from base64
  const playAudioFromBase64 = async (base64Audio) => {
    setInterviewState("AI_SPEAKING");
    setIsMicEnabled(false);
    isPlayingRef.current = true;

    try {
      const audioBlob = base64ToBlob(base64Audio, "audio/wav");
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        isPlayingRef.current = false;
        setInterviewState("USER_RESPONDING");
        setIsMicEnabled(true);
        startRecording();
      };

      await audio.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setInterviewState("USER_RESPONDING");
      setIsMicEnabled(true);
      startRecording();
    }
  };

  // Stop Web Speech Recognition
  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current && isRecording) {
      console.log("Stopping speech recognition...");
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Start Web Speech Recognition
  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Web Speech API is not supported in this browser.");
      setErrorMessage("Web Speech API is not supported. Please use Chrome.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
      setIsTranscribing(true);
      setFinalTranscript("");
      setInterimTranscript("");
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setFinalTranscript(prev => (prev ? prev + " " + final : final));
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setErrorMessage(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
      setIsTranscribing(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
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

  // Silence detection
  const handleSilenceDetection = () => {
    setSilenceTimer((prev) => {
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

  // Timer functions
  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Handle interview end
  const handleInterviewEnd = () => {
    setInterviewState("ENDED");
    stopTimer();
    stopRecording();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    disconnectSocket();
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

  // Updated handler to send final transcript
  const handleSendClick = () => {
    console.log("Send button clicked");
    if (isRecording) {
      stopRecording();
      if (finalTranscript.trim()) {
        console.log("Sending final transcript:", finalTranscript.trim());
        setInterviewState("PROCESSING");
        sendCompleteResponse({ finalText: finalTranscript.trim() });
      }
    }
  };

  // Start timer when interview begins
  useEffect(() => {
    if (
      interviewState === "AI_SPEAKING" &&
      currentQuestion === 1 &&
      elapsedTime === 0
    ) {
      startTimer();
    }
  }, [interviewState, currentQuestion, elapsedTime]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && interviewState !== "ENDED") {
        setShowTabWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interviewState]);

  const resumeInterview = () => {
    setShowTabWarning(false);
  };

  // Render AI Avatar
  const renderAIAvatar = () => {
    const isAISpeaking = interviewState === "AI_SPEAKING";

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="relative mb-4">
          <div
            className={`w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center transition-all duration-300 ${
              isAISpeaking ? "scale-110" : "scale-100"
            }`}
          >
            <div className="text-white text-4xl font-bold">AI</div>
          </div>

          {isAISpeaking && (
            <>
              <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <Volume2 className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
            </>
          )}

          {interviewState === "USER_RESPONDING" && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Display current question */}
        {currentQuestionText && (
          <div className="max-w-md mx-4 p-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-800 text-center">{currentQuestionText}</p>
          </div>
        )}
        
        {/* Display transcript */}
        {(interimTranscript || finalTranscript) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4 text-center">
                {interimTranscript && (
                    <p className="text-gray-600 italic mb-2">{interimTranscript}</p>
                )}
                {finalTranscript && (
                    <p className="text-gray-800 font-medium">{finalTranscript}</p>
                )}
            </div>
        )}

        <div className="absolute bottom-4 left-4 text-sm text-gray-600">
          {isAISpeaking ? "AI is speaking..." : "AI is listening..."}
        </div>
      </div>
    );
  };

  // Main render
  if (interviewState === "ENDED") {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Interview Completed!</h2>
          <p className="text-gray-600 mb-4">
            Great job! You've completed the interview.
          </p>
          <div className="space-y-2 text-left bg-gray-50 rounded p-4">
            <p className="text-sm">
              <span className="font-semibold">Duration:</span>{" "}
              {formatTime(elapsedTime)}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Questions answered:</span>{" "}
              {currentQuestion}
            </p>
          </div>
          <button
            onClick={() => navigate("/get-started")}
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
            {connectionStatus === "connected" ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span
              className={`text-sm ${
                connectionStatus === "connected"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {connectionStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-white text-sm">Question #{currentQuestion}</div>
          <div className="flex items-center space-x-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* AI Avatar Side */}
        <div className="flex-1 relative">{renderAIAvatar()}</div>

        {/* User Video Side */}
        <div className="flex-1 relative bg-gray-800">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${
              !isCameraOn ? "hidden" : ""
            }`}
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
            ) : isTranscribing ? (
              <>
                <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-yellow-400 text-sm">
                  Processing speech...
                </span>
              </>
            ) : (
              <>
                <MicOff className="w-6 h-6 text-gray-400" />
                <span className="text-gray-400 text-sm">
                  {isMicEnabled ? "Ready to record" : "Mic disabled"}
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
                    audioLevel > i * 50 ? "bg-green-400" : "bg-gray-600"
                  }`}
                  style={{ height: `${8 + i * 4}px` }}
                />
              ))}
            </div>
          )}
          {/* Send Button */}
          <button
            onClick={handleSendClick}
            disabled={!isRecording && !finalTranscript.trim()}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition ${
              isRecording || finalTranscript.trim()
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
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
          <button
            onClick={() => setErrorMessage("")}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-2">Interview Paused</h3>
            <p className="text-gray-600 mb-4">
              You switched to another tab. Please stay focused on the interview.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={resumeInterview}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Continue Interview
              </button>
              <button
                onClick={handleInterviewEnd}
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