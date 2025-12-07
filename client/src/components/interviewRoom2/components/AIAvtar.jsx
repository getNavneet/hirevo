import React from 'react';

export const AIAvatar = ({ isPlaying }) => {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Main Avatar Circle with Animation */}
      <div className="relative">
        {/* Outer Rings - Animated when speaking */}
        {isPlaying && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full border-4 border-purple-400/30 animate-ping" 
                 style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
          </>
        )}

        {/* Main Avatar */}
        <div className={`relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isPlaying ? 'scale-110' : 'scale-100'
        }`}>
          {/* Inner Glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 blur-xl opacity-50" />
          
          {/* AI Icon/Face */}
          <div className="relative z-10">
            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h2v2H7zm8 0h2v2h-2zm-4 4h2v2h-2z" />
            </svg>
          </div>

          {/* Waveform Animation when speaking */}
          {isPlaying && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-end gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full animate-bounce"
                  style={{
                    height: `${16 + Math.random() * 16}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <h2 className="text-white text-2xl font-bold mb-2">AI Interviewer</h2>
        <p className={`text-lg font-medium transition-colors ${
          isPlaying ? 'text-blue-300' : 'text-gray-400'
        }`}>
          {isPlaying ? 'Speaking...' : 'Listening'}
        </p>
      </div>

      {/* Sound Wave Visualization when speaking */}
      {isPlaying && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-400 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 24}px`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
