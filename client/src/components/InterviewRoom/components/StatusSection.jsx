import React from 'react';

const StatusSection = ({ statusMessage, audioPlaying, micActive }) => {
  return (
    <div className="status-section">
      <div className="status-message">
        {statusMessage}
      </div>
      {audioPlaying && <div className="audio-indicator">🔊 Playing question...</div>}
      {micActive && <div className="mic-indicator">🎤 Recording...</div>}
    </div>
  );
};

export default StatusSection;