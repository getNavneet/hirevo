import React from 'react';

export const AudioControls = ({
  isRecording,
  canRecord,
  isAIPlaying,
  hasFinalTranscript,
  onStartRecording,
  onStopRecording,
  onSendResponse,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Recording Button */}
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={!canRecord || isAIPlaying}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-lg'
              : canRecord
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isRecording ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="6" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a4 4 0 00-4 4v4a4 4 0 008 0V6a4 4 0 00-4-4zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
            </svg>
          )}
        </button>

        {/* Status Text */}
        <p className="text-sm text-gray-600 text-center">
          {isAIPlaying
            ? 'Please wait for AI to finish speaking'
            : isRecording
            ? 'Recording... Click to stop'
            : canRecord
            ? 'Click to start speaking'
            : 'Waiting...'}
        </p>

        {/* Send Response Button */}
        {hasFinalTranscript && !isRecording && (
          <button
            onClick={onSendResponse}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Send Response & Continue
          </button>
        )}
      </div>
    </div>
  );
};
