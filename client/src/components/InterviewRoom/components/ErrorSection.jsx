import React from 'react';

const ErrorSection = ({ error, interviewStatus }) => {
  return (
    <>
      {error && (
        <div className="error-section">
          <p className="error-message">⚠️ {error}</p>
        </div>
      )}

      {interviewStatus === 'complete' && (
        <div className="completion-section">
          <h2>🎉 Interview Completed!</h2>
          <p>Thank you for participating in the AI interview.</p>
        </div>
      )}
    </>
  );
};

export default ErrorSection;