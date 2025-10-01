import { useRef, useState, useCallback, useEffect } from 'react';

export const useAudioRecorder = (onAudioChunk) => {
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const isStoppingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);

  const AUTO_STOP_DELAY = 40000;

  useEffect(() => {
    return () => {
      if (!isStoppingRef.current && mediaRecorderRef.current) {
        stopRecording();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!onAudioChunk || typeof onAudioChunk !== 'function') {
      console.error('[Audio] No valid onAudioChunk callback provided!');
      setError('No audio callback configured');
      return;
    }

    try {
      setError(null);
      isStoppingRef.current = false;
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

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      console.log('[Audio] Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });

      let chunkCount = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && !isStoppingRef.current) {
          chunkCount++;
          console.log(`[Audio] Chunk #${chunkCount} available, size: ${event.data.size}`);
          
          event.data.arrayBuffer()
            .then((buffer) => {
              const uint8Array = new Uint8Array(buffer);
              console.log(`[Audio] Converted chunk #${chunkCount} to Uint8Array, length:`, uint8Array.length);
              console.log('[Audio] Calling onAudioChunk callback...');
              
              try {
                onAudioChunk(uint8Array);
                console.log(`[Audio] Successfully sent chunk #${chunkCount}`);
              } catch (callbackError) {
                console.error('[Audio] Error in onAudioChunk callback:', callbackError);
              }
            })
            .catch(err => {
              console.error('[Audio] Error converting audio chunk:', err);
            });
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[Audio] MediaRecorder error:', event.error);
        setError(event.error.message);
        stopRecording();
      };

      mediaRecorder.onstart = () => {
        console.log('[Audio] MediaRecorder started');
        setIsRecording(true);
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        autoStopTimeoutRef.current = setTimeout(() => {
          console.log('[Audio] Auto-stopping recording after 40 seconds');
          stopRecording();
        }, AUTO_STOP_DELAY);
      };

      mediaRecorder.onstop = () => {
        console.log('[Audio] MediaRecorder stopped');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      console.log('[Audio] Recording started with 250ms chunks');

    } catch (err) {
      console.error('[Audio] Error starting recording:', err);
      setError(err.message);
      setIsRecording(false);
      isStoppingRef.current = false;
    }
  }, [onAudioChunk]); // Keep dependency

  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) {
      console.log('[Audio] Already stopping, ignoring duplicate stop call');
      return;
    }
    
    isStoppingRef.current = true;
    console.log('[Audio] Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('[Audio] Error stopping MediaRecorder:', err);
      }
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.error('[Audio] Error stopping track:', err);
        }
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
    
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
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
