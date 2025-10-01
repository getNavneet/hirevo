import { useEffect, useState, useRef } from 'react';

export const useAudioLevel = (isRecording, existingStream = null) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !existingStream) {
      setAudioLevel(0);
      return;
    }

    const initAudioLevel = async () => {
      try {
        // Use existing stream instead of requesting a new one
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(existingStream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!isRecording) return;

          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
          const normalizedLevel = Math.min(100, (average / 128) * 100);
          
          setAudioLevel(normalizedLevel);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.error('[AudioLevel] Error initializing audio level monitor:', err);
      }
    };

    initAudioLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, existingStream]);

  return audioLevel;
};
