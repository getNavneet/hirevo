import { useState, useRef } from 'react';

export const useAudioPlayer = () => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  const playAudio = async (audioData, onEnded) => {
    try {
      setAudioPlaying(true);
      
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
          onEnded?.();
        };
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioPlaying(false);
      onEnded?.();
    }
  };

  return { audioPlaying, audioRef, playAudio };
};