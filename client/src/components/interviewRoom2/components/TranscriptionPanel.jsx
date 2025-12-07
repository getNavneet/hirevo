import React from 'react';

export const TranscriptionPanel = ({ 
  partialTranscript, 
  finalTranscript, 
  isRecording,
  recordingTime 
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border flex-1 flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Your Response</h3>
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {finalTranscript && (
          <div className="mb-3">
            <p className="text-gray-900">{finalTranscript}</p>
          </div>
        )}
        
        {partialTranscript && isRecording && (
          <div className="text-gray-500 italic">
            {partialTranscript}
          </div>
        )}

        {!finalTranscript && !partialTranscript && (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-center">
              {isRecording 
                ? 'Listening... Start speaking' 
                : 'Click the microphone to start answering'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
