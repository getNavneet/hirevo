import { useRef, useState, useCallback, useEffect } from 'react';

export const useAudioRecorder = (onAudioChunk) => {
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);

  const AUTO_STOP_DELAY = 40000;

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      console.log('[Audio] Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log('[Audio] Microphone access granted');
      audioStreamRef.current = stream;

      // Check browser support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      console.log('[Audio] Using MIME type:', mimeType);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunk) {
          console.log('[Audio] Chunk available, size:', event.data.size);
          
          // Convert to ArrayBuffer then Uint8Array (same as working test component)
          event.data.arrayBuffer().then((buffer) => {
            const uint8Array = new Uint8Array(buffer);
            onAudioChunk(uint8Array); // Send Uint8Array directly, not Array.from()
          });
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('[Audio] MediaRecorder error:', event.error);
        setError(event.error.message);
        stopRecording();
      };

      mediaRecorderRef.current.onstart = () => {
        console.log('[Audio] MediaRecorder started');
        setIsRecording(true);
        setRecordingTime(0);

        // Start recording timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        // Auto-stop after 40 seconds
        autoStopTimeoutRef.current = setTimeout(() => {
          console.log('[Audio] Auto-stopping recording after 40 seconds');
          stopRecording();
        }, AUTO_STOP_DELAY);
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('[Audio] MediaRecorder stopped');
      };

      // Start recording with 250ms chunks (same as working test)
      mediaRecorderRef.current.start(250);
      console.log('[Audio] Recording started with 250ms chunks');

    } catch (err) {
      console.error('[Audio] Error starting recording:', err);
      setError(err.message);
      setIsRecording(false);
    }
  }, [onAudioChunk]);

  const stopRecording = useCallback(() => {
    console.log('[Audio] Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Audio] Stopped track:', track.kind);
      });
      audioStreamRef.current = null;
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    console.log('[Audio] Recording stopped completely');
  }, []);

  return {
    isRecording,
    recordingTime,
    error,
    audioStream: audioStreamRef.current, 
    startRecording,
    stopRecording,
  };
};
