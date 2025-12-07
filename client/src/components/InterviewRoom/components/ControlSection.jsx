import React from 'react';

const ControlsSection = ({ 
  showSendButton, 
  transcription, 
  interviewStatus, 
  onSendResponse 
}) => {
  if (!showSendButton || !transcription) return null;

  return (
    <div className="controls-section">
      <button 
        className="send-button"
        onClick={onSendResponse}
        disabled={!transcription.trim() || interviewStatus === 'processing'}
      >
        Send Response & Next Question
      </button>
    </div>
  );
};

export default ControlsSection;