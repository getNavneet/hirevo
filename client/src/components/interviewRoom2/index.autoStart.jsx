import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSTTSocket } from "./hooks/useSTTSocket";
import { useInterviewSocket } from "./hooks/useInterviewSocket";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useAudioLevel } from "./hooks/useAudioLevel";
import { AIAvatar } from "./components/AIAvtar";
import { InterviewComplete } from "./components/InterviewComplete";

export const InterviewRoom = () => {
  const { sessionId } = useParams();

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [shouldAutoStartRecording, setShouldAutoStartRecording] =
    useState(false);
  // Socket hooks
  const sttSocket = useSTTSocket();
  const interviewSocket = useInterviewSocket();

  // Audio recorder with STT integration
  const audioRecorder = useAudioRecorder((audioChunk) => {
    sttSocket.sendAudioChunk(audioChunk);
  });

  // Audio level monitoring
  const audioLevel = useAudioLevel(
    audioRecorder.isRecording,
    audioRecorder.audioStream
  );

  // Initialize user webcam
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    initWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Join interview on mount
  useEffect(() => {
    if (interviewSocket.isConnected && sessionId) {
      interviewSocket.joinInterview(sessionId);
    }
  }, [interviewSocket.isConnected, sessionId]);

  // Handle AI audio playback
  useEffect(() => {
    if (interviewSocket.questionAudio) {
      playAIAudio(interviewSocket.questionAudio);
    }
  }, [interviewSocket.questionAudio]);

  // Auto-start recording when AI finishes speaking
  // useEffect(() => {
  //   if (
  //     !isAIPlaying &&
  //     interviewSocket.interviewStatus === "active" &&
  //     !audioRecorder.isRecording &&
  //     !isSending
  //   ) {
  //     // AI just finished, auto-start recording
  //     console.log("[Room] AI finished speaking, auto-starting recording...");
  //     handleStartRecording();
  //   }
  // }, [isAIPlaying, interviewSocket.interviewStatus]);

  useEffect(() => {
  if (
    shouldAutoStartRecording &&           // only after AI finished speaking
    !audioRecorder.isRecording &&
    !sttSocket.isRecognitionActive
  ) {
    handleStartRecording();
    setShouldAutoStartRecording(false);   // reset to prevent looping
  }
}, [shouldAutoStartRecording, audioRecorder.isRecording, sttSocket.isRecognitionActive]);

  const playAIAudio = (base64Audio) => {
  if (audioRecorder.isRecording) {
    // Safety: stop ongoing recording
    audioRecorder.stopRecording();
    sttSocket.stopRecognition();
  }
  setIsAIPlaying(true);
  setShouldAutoStartRecording(false);
  const audioBlob = new Blob([
    Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
  ], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(audioBlob);
  if (audioRef.current) {
    audioRef.current.src = audioUrl;
    audioRef.current.play();
  }
};

  // const handleAudioEnded = () => {
  //   console.log("[Room] AI audio playback ended");
  //   setIsAIPlaying(false);
  //   // Auto-start will trigger via useEffect
  // };

  const handleAudioEnded = () => {
  console.log('[Room] AI audio playback ended');
  setIsAIPlaying(false);
  setShouldAutoStartRecording(true); // Triggers useEffect below
};

  const handleStartRecording = async () => {
    if (audioRecorder.isRecording || sttSocket.isRecognitionActive) {
      console.log("[Room] Already recording, ignoring duplicate start");
      return;
    }

    if (isAIPlaying) {
      console.log("[Room] Cannot start recording while AI is speaking");
      return;
    }

    console.log("[Room] Starting recording process...");

    try {
      sttSocket.resetTranscripts();

      console.log("[Room] Starting STT recognition...");
      sttSocket.startRecognition();

      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("[Room] Starting audio recording...");
      await audioRecorder.startRecording();

      console.log("[Room] Recording started successfully");
    } catch (err) {
      console.error("[Room] Error starting recording:", err);
      sttSocket.stopRecognition();
    }
  };

  const handleSendResponse = async () => {
    if (isSending) {
      console.log("[Room] Already sending, please wait...");
      return;
    }

    console.log("[Room] Send button clicked");
    setIsSending(true);

    try {
      // Stop recording immediately
      if (audioRecorder.isRecording) {
        console.log("[Room] Stopping recording...");
        audioRecorder.stopRecording();
      }

      // Stop STT recognition
      if (sttSocket.isRecognitionActive) {
        console.log("[Room] Stopping STT recognition...");
        sttSocket.stopRecognition();
      }

      // Wait a moment for final transcription to arrive
      console.log("[Room] Waiting for final transcription...");
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Check if we have transcription
      let response = sttSocket.finalTranscript.trim();

      if (!response) {
        console.log("[Room] No transcription available after waiting");
        // You can show error or just continue
        setIsSending(false);
        return;
      }

      console.log("[Room] Sending response:", response);

      // Send to interview server
      interviewSocket.sendCompleteResponse(response);

      // Clear transcripts
      sttSocket.resetTranscripts();
    } catch (err) {
      console.error("[Room] Error sending response:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Show completion screen
  if (interviewSocket.interviewStatus === "complete") {
    return <InterviewComplete message={interviewSocket.currentQuestion} />;
  }

  const hasFinalTranscript = !!sttSocket.finalTranscript.trim();
  const bothConnected = sttSocket.isConnected && interviewSocket.isConnected;
  const canSend =
    (hasFinalTranscript || audioRecorder.isRecording) &&
    !isSending &&
    !isAIPlaying;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* Top Bar - Connection Status */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-white font-semibold text-lg">AI Interview</div>
            <div className="text-gray-300 text-sm">
              Session: {sessionId?.substring(0, 8)}...
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
              <div
                className={`w-2 h-2 rounded-full ${
                  bothConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-white text-sm font-medium">
                {bothConnected ? "Connected" : "Connecting..."}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    sttSocket.isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>STT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    interviewSocket.isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>Interview</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="w-full h-full flex">
        {/* Left Half - AI Avatar & Question */}
        <div className="w-1/2 h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-12 relative">
          <AIAvatar isPlaying={isAIPlaying} />

          <div className="absolute bottom-20 left-8 right-8">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                </div>
                <div className="flex-1">
                  {interviewSocket.currentQuestion ? (
                    <p className="text-white text-lg leading-relaxed">
                      {interviewSocket.currentQuestion}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">
                      Preparing your question...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Half - User Video */}
        <div className="w-1/2 h-full bg-black flex items-center justify-center relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Recording Indicator */}
          {audioRecorder.isRecording && (
            <div className="absolute top-8 left-8 flex items-center gap-3 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-medium">Recording</span>
              <span className="text-white/80 text-sm">
                {Math.floor(audioRecorder.recordingTime / 60)}:
                {(audioRecorder.recordingTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {/* Audio Level Indicator */}
          {audioRecorder.isRecording && (
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                <span className="text-white text-sm font-medium">
                  Audio Level
                </span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-100 ${
                      audioLevel > (i + 1) * 10 ? "bg-green-500" : "bg-gray-600"
                    }`}
                    style={{
                      height: `${20 + i * 6}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transcript Overlay */}
          {(sttSocket.partialTranscript || sttSocket.finalTranscript) && (
            <div className="absolute bottom-32 left-8 right-8">
              <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm font-medium">
                    Your Response
                  </span>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="text-white/60 hover:text-white text-xs"
                  >
                    {showTranscript ? "Hide" : "Show"}
                  </button>
                </div>
                {showTranscript && (
                  <div className="space-y-2">
                    {sttSocket.finalTranscript && (
                      <p className="text-white leading-relaxed">
                        {sttSocket.finalTranscript}
                      </p>
                    )}
                    {sttSocket.partialTranscript &&
                      audioRecorder.isRecording && (
                        <p className="text-blue-300 italic">
                          {sttSocket.partialTranscript}
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar - Single Send Button */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md">
        <div className="px-8 py-6 flex items-center justify-between">
          {/* Left - Status */}
          <div className="flex items-center gap-4">
            {isAIPlaying && (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="flex gap-1">
                  <div
                    className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="font-medium">AI is speaking...</span>
              </div>
            )}
            {audioRecorder.isRecording && !isAIPlaying && (
              <div className="text-red-400 font-medium">
                Recording your response...
              </div>
            )}
            {!audioRecorder.isRecording && !isAIPlaying && !isSending && (
              <div className="text-green-400 font-medium">
                {hasFinalTranscript ? "Ready to send" : "Waiting to record..."}
              </div>
            )}
            {isSending && (
              <div className="text-yellow-400 font-medium">
                Processing your response...
              </div>
            )}
          </div>

          {/* Center - Send Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSendResponse}
              disabled={!canSend}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all transform ${
                canSend
                  ? "bg-green-600 hover:bg-green-700 hover:scale-105 text-white shadow-lg shadow-green-500/50"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              } ${isSending ? "animate-pulse" : ""}`}
            >
              <div className="flex items-center gap-3">
                {isSending ? (
                  <>
                    <svg
                      className="w-6 h-6 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                    Send Response
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Right - Helper Text */}
          <div className="text-right">
            <p className="text-gray-400 text-sm">
              {audioRecorder.isRecording && "Click Send when done"}
              {!audioRecorder.isRecording &&
                hasFinalTranscript &&
                "Click Send to continue"}
              {isAIPlaying && "Wait for AI to finish"}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: "none" }}
      />

      {/* Error Toast */}
      {(sttSocket.error || interviewSocket.error || audioRecorder.error) && (
        <div className="fixed top-20 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md z-50 animate-slide-in">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm opacity-90">
                {sttSocket.error ||
                  interviewSocket.error ||
                  audioRecorder.error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InterviewRoom;