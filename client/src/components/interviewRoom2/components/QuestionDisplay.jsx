import React from 'react';

export const QuestionDisplay = ({ question, isAIPlaying, status }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isAIPlaying ? 'bg-blue-100 animate-pulse' : 'bg-gray-100'
          }`}>
            <span className="text-xl">🤖</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">AI Interviewer</h3>
            {isAIPlaying && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Speaking...
              </span>
            )}
          </div>
          {question ? (
            <p className="text-gray-700 leading-relaxed">{question}</p>
          ) : (
            <p className="text-gray-400 italic">
              {status === 'joining' ? 'Preparing your interview...' : 'Waiting for question...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
