import React from 'react';

const InterviewHeader = ({ isConnected }) => {
  return (
    <div className="interview-header">
      <h1>AI Interview Session</h1>
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
};

export default InterviewHeader;