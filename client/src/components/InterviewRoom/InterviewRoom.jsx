import React from 'react';
import { useSocket } from './hooks/useSocket';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMicRecording } from './hooks/useMicRecording';
import { useInterviewState } from './hooks/useInterviewState';
import InterviewHeader from './components/InterviewHeader';
import StatusSection from './components/StatusSection';
import QuestionSection from './components/QuestionSection';
import TranscriptionSection from './components/TranscriptionSection';
import ControlsSection from './components/ControlsSection';
import ErrorSection from './components/ErrorSection';

const InterviewRoom = () => {
  const { socket, isConnected, error, setError } = useSocket();
  const { audioPlaying, audioRef, playAudio } = useAudioPlayer();
  const { micActive, startRecording, stopRecording } = useMicRecording(socket);
  
  const {
    interviewStatus,
    currentQuestion,
    transcription,
    partialTranscription,
    showSendButton,
    handleSendResponse,
    getStatusMessage
  } = useInterviewState(socket, startRecording, stopRecording, playAudio, setError);

  return (
    <div className="interview-room">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <InterviewHeader isConnected={isConnected} />
      
      <StatusSection 
        statusMessage={getStatusMessage()} 
        audioPlaying={audioPlaying}
        micActive={micActive}
      />
      
      <QuestionSection currentQuestion={currentQuestion} />
      
      <TranscriptionSection 
        transcription={transcription}
        partialTranscription={partialTranscription}
      />
      
      <ControlsSection
        showSendButton={showSendButton}
        transcription={transcription}
        interviewStatus={interviewStatus}
        onSendResponse={handleSendResponse}
      />
      
      <ErrorSection error={error} interviewStatus={interviewStatus} />
    </div>
  );
};

export default InterviewRoom;