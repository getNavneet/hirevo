import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const [showTranscript, setShowTranscript] = useState(true);
  const [uiError, setUiError] = useState('');

  const sttSocket = useSTTSocket();
  const interviewSocket = useInterviewSocket();

  const audioRecorder = useAudioRecorder((audioChunk) => {
    sttSocket.sendAudioChunk(audioChunk);
  });

  const audioLevel = useAudioLevel(
    audioRecorder.isRecording,
    audioRecorder.audioStream
  );

  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        setUiError('Unable to access webcam. Please allow camera permissions.');
      }
    };

    initWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (interviewSocket.isConnected && sessionId) {
      interviewSocket.joinInterview(sessionId);
    }
  }, [interviewSocket.isConnected, sessionId]);

  useEffect(() => {
    if (!interviewSocket.questionAudio) return;

    try {
      setIsAIPlaying(true);
      setCanRecord(false);

      const bytes = Uint8Array.from(atob(interviewSocket.questionAudio), (c) => c.charCodeAt(0));
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {
          setIsAIPlaying(false);
          setCanRecord(true);
        });
      }
    } catch (error) {
      setIsAIPlaying(false);
      setCanRecord(true);
      setUiError('Unable to play interview audio.');
    }
  }, [interviewSocket.questionAudio]);

  const handleAudioEnded = () => {
    setIsAIPlaying(false);
    setCanRecord(true);
  };

  const handleStartRecording = async () => {
    if (!canRecord || !sttSocket.isConnected) return;

    setUiError('');
    sttSocket.resetTranscripts();
    sttSocket.startRecognition();

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      await audioRecorder.startRecording();
    } catch (error) {
      sttSocket.stopRecognition();
      setUiError('Unable to start recording. Please check microphone permission.');
    }
  };

  const handleStopRecording = () => {
    audioRecorder.stopRecording();
    sttSocket.stopRecognition();
  };

  const handleSubmitResponse = () => {
    const response = sttSocket.finalTranscript.trim();
    if (!response) return;

    interviewSocket.sendCompleteResponse(response);
    sttSocket.resetTranscripts();
    setCanRecord(false);
  };

  if (interviewSocket.interviewStatus === 'complete') {
    return <InterviewComplete message={interviewSocket.currentQuestion} />;
  }

  const hasTranscript = Boolean(sttSocket.finalTranscript.trim() || sttSocket.partialTranscript.trim());
  const canSend = Boolean(sttSocket.finalTranscript.trim()) && !audioRecorder.isRecording;
  const bothConnected = sttSocket.isConnected && interviewSocket.isConnected;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:h-screen lg:p-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Hirevo Interview Console</h1>
              <p className="text-sm text-slate-400">Session: {sessionId || 'Missing session id'}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${bothConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{bothConnected ? 'All services connected' : 'Waiting for services...'}</span>
              <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">STT: {sttSocket.isConnected ? 'up' : 'down'}</span>
              <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">Interview: {interviewSocket.isConnected ? 'up' : 'down'}</span>
            </div>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">AI Interviewer</h2>
              <span className={`text-sm ${isAIPlaying ? 'text-blue-300' : 'text-slate-400'}`}>
                {isAIPlaying ? 'Speaking...' : canRecord ? 'Ready for your answer' : 'Preparing...'}
              </span>
            </div>
            <div className="mb-6 flex justify-center">
              <AIAvatar isPlaying={isAIPlaying} />
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Current Question</p>
              <p className="leading-relaxed text-slate-100">
                {interviewSocket.currentQuestion || 'Loading your first interview question...'}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Candidate Feed</h2>
              <span className="text-sm text-slate-400">
                {audioRecorder.isRecording
                  ? `Recording ${Math.floor(audioRecorder.recordingTime / 60)}:${(audioRecorder.recordingTime % 60)
                      .toString()
                      .padStart(2, '0')}`
                  : 'Idle'}
              </span>
            </div>

            <div className="relative mb-4 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              {audioRecorder.isRecording && (
                <div className="absolute left-3 top-3 rounded-full bg-rose-500/90 px-3 py-1 text-xs font-semibold">REC</div>
              )}
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Audio Level</span>
                <span>{Math.round(audioLevel)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, audioLevel))}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">Live Transcript</p>
                <button
                  type="button"
                  className="text-xs text-slate-300 hover:text-white"
                  onClick={() => setShowTranscript((prev) => !prev)}
                >
                  {showTranscript ? 'Hide' : 'Show'}
                </button>
              </div>
              {showTranscript && (
                <div className="space-y-2 text-sm">
                  {sttSocket.finalTranscript && <p className="text-slate-100">{sttSocket.finalTranscript}</p>}
                  {sttSocket.partialTranscript && <p className="italic text-cyan-300">{sttSocket.partialTranscript}</p>}
                  {!hasTranscript && <p className="text-slate-500">Transcript will appear when you start speaking.</p>}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              {canRecord && !audioRecorder.isRecording && 'You can start your response.'}
              {audioRecorder.isRecording && 'Recording in progress. Stop and submit when done.'}
              {!canRecord && !audioRecorder.isRecording && 'Wait for AI question audio to finish.'}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={!canRecord || audioRecorder.isRecording || !sttSocket.isConnected}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start Recording
              </button>

              <button
                type="button"
                onClick={handleStopRecording}
                disabled={!audioRecorder.isRecording}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Stop Recording
              </button>

              <button
                type="button"
                onClick={handleSubmitResponse}
                disabled={!canSend}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit Response
              </button>
            </div>
          </div>
        </footer>
      </div>

      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {(uiError || sttSocket.error || interviewSocket.error) && (
        <div className="fixed right-4 top-4 max-w-md rounded-lg border border-rose-400/30 bg-rose-500/20 p-4 text-sm text-rose-100">
          {uiError || sttSocket.error || interviewSocket.error}
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
