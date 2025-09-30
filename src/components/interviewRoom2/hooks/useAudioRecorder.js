import { useRef, useState, useCallback, useEffect } from 'react';

export const useAudioRecorder = (onAudioChunk) => {
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);

  // Auto-stop after 40 seconds of recording
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
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      audioStreamRef.current = stream;

      const mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Browser does not support WEBM/Opus audio recording');
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunk) {
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            onAudioChunk(Array.from(uint8Array));
          };
          reader.readAsArrayBuffer(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Send chunks every 100ms
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

      console.log('[Audio] Recording started');
    } catch (err) {
      console.error('[Audio] Error starting recording:', err);
      setError(err.message);
    }
  }, [onAudioChunk]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
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

      console.log('[Audio] Recording stopped');
    }
  }, [isRecording]);

  return {
    isRecording,
    recordingTime,
    error,
    startRecording,
    stopRecording,
  };
};
