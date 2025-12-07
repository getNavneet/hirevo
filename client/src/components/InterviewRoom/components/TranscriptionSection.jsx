import React from 'react';

const TranscriptionSection = ({ transcription, partialTranscription }) => {
  if (!transcription && !partialTranscription) return null;

  return (
    <div className="transcription-section">
      <h3>Your Response:</h3>
      <div className="transcription-text">
        <span className="final-text">{transcription}</span>
        {partialTranscription && (
          <span className="partial-text"> {partialTranscription}</span>
        )}
      </div>
    </div>
  );
};

export default TranscriptionSection;