import { useState, useRef } from 'react';

export const useMicRecording = (socket) => {
  const [micActive, setMicActive] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      socket.emit('startSpeechRecognition');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          event.data.arrayBuffer().then(arrayBuffer => {
            const uint8Array = new Uint8Array(arrayBuffer);
            socket.emit('audioChunk', uint8Array);
          });
        }
      };
      
      mediaRecorder.start(100);
      setMicActive(true);
      
    } catch (error) {
      console.error('Error starting microphone:', error);
      throw new Error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (socket) {
      socket.emit('stopSpeechRecognition');
    }
    
    setMicActive(false);
  };

  return { micActive, setMicActive, startRecording, stopRecording };
};