import React, { useState, useRef, useEffect } from 'react';
import { useParams} from 'react-router-dom';
import { useSTTSocket } from './hooks/useSTTSocket';
import { useInterviewSocket } from './hooks/useInterviewSocket';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useAudioLevel } from './hooks/useAudioLevel';
import { AIAvatar } from './components/AIAvtar';
import { InterviewComplete } from './components/InterviewComplete';

 const InterviewRoom = () => {
  const { sessionId } = useParams();

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

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
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    };
    initWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
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

  const playAIAudio = (base64Audio) => {
    try {
      setIsAIPlaying(true);
      setCanRecord(false);
      
      const audioBlob = new Blob([
        Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
      ], { type: 'audio/wav' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      handleAudioEnded();
    }
  };

  const handleAudioEnded = () => {
    setIsAIPlaying(false);
    setCanRecord(true);
  };

//   const handleStartRecording = async () => {
//     if (!canRecord) return;
    
//     sttSocket.resetTranscripts();
//     sttSocket.startRecognition();
//     await audioRecorder.startRecording();
//   };

const handleStartRecording = async () => {
  if (!canRecord) {
    console.log('[Room] Cannot record - not ready');
    return;
  }
  
  console.log('[Room] Starting recording process...');
  console.log('[Room] STT connected:', sttSocket.isConnected);
  console.log('[Room] STT recognition active:', sttSocket.isRecognitionActive);
  
  try {
    // Reset transcripts
    sttSocket.resetTranscripts();
    
    // Start STT recognition first
    console.log('[Room] Starting STT recognition...');
    sttSocket.startRecognition();
    
    // Wait a moment for STT to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Then start audio recording
    console.log('[Room] Starting audio recording...');
    await audioRecorder.startRecording();
    
    console.log('[Room] Recording started successfully');
  } catch (err) {
    console.error('[Room] Error starting recording:', err);
    setError(err.message);
  }
};


  const handleSendResponse = () => {
    const response = sttSocket.finalTranscript.trim();
    if (response) {
      // Stop recording and stream
      audioRecorder.stopRecording();
      sttSocket.stopRecognition();
      
      // Send response to interview server
      interviewSocket.sendCompleteResponse(response);
      sttSocket.resetTranscripts();
      setCanRecord(false);
    }
  };

  // Show completion screen
  if (interviewSocket.interviewStatus === 'complete') {
    return <InterviewComplete message={interviewSocket.currentQuestion} />;
  }

  const hasFinalTranscript = !!sttSocket.finalTranscript.trim();
  const bothConnected = sttSocket.isConnected && interviewSocket.isConnected;

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
            {/* Connection Indicators */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                bothConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-white text-sm font-medium">
                {bothConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>

            {/* Individual Status */}
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  sttSocket.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>STT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  interviewSocket.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
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
          {/* AI Avatar with Speaking Animation */}
          <AIAvatar isPlaying={isAIPlaying} />

          {/* Current Question */}
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
                {Math.floor(audioRecorder.recordingTime / 60)}:{(audioRecorder.recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Audio Level Indicator */}
          {audioRecorder.isRecording && (
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                <span className="text-white text-sm font-medium">Audio Level</span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-100 ${
                      audioLevel > (i + 1) * 10
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                    style={{
                      height: `${20 + i * 6}%`
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
                  <span className="text-white/60 text-sm font-medium">Your Response</span>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="text-white/60 hover:text-white text-xs"
                  >
                    {showTranscript ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showTranscript && (
                  <div className="space-y-2">
                    {sttSocket.finalTranscript && (
                      <p className="text-white leading-relaxed">
                        {sttSocket.finalTranscript}
                      </p>
                    )}
                    {sttSocket.partialTranscript && (
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

      {/* Bottom Bar - Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md">
        <div className="px-8 py-6 flex items-center justify-between">
          {/* Left - Status */}
          <div className="flex items-center gap-4">
            {isAIPlaying && (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="font-medium">AI is speaking...</span>
              </div>
            )}
            {canRecord && !audioRecorder.isRecording && (
              <div className="text-green-400 font-medium">
                Ready to record your response
              </div>
            )}
            {audioRecorder.isRecording && (
              <div className="text-red-400 font-medium">
                Recording your response...
              </div>
            )}
          </div>

          {/* Center - Main Action Button */}
          <div className="flex items-center gap-4">
            {!audioRecorder.isRecording && !hasFinalTranscript && (
              <button
                onClick={handleStartRecording}
                disabled={!canRecord || isAIPlaying}
                className={`px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 ${
                  canRecord && !isAIPlaying
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                  Start Recording
                </div>
              </button>
            )}

            {audioRecorder.isRecording && (
              <button
                onClick={audioRecorder.stopRecording}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-red-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white rounded" />
                  Stop Recording
                </div>
              </button>
            )}

            {hasFinalTranscript && !audioRecorder.isRecording && (
              <button
                onClick={handleSendResponse}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Send Response & Continue
                </div>
              </button>
            )}
          </div>

          {/* Right - Additional Controls */}
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />

      {/* Error Toast */}
      {(sttSocket.error || interviewSocket.error) && (
        <div className="fixed top-20 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md z-50 animate-slide-in">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm opacity-90">{sttSocket.error || interviewSocket.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InterviewRoom;