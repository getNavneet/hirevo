import WebSocket from 'ws';

const ENHANCED_SPEECH_CONFIG = {
  // Audio configuration
  sample_rate: 48000, // Higher sample rate for better quality
  encoding: 'pcm_s16le', // Linear PCM 16-bit little-endian
  
  // Language and model settings
  language_code: 'en', // AssemblyAI uses broader language codes
  
  // Enhanced features for better accuracy
  punctuate: true, // Automatic punctuation
  format_text: true, // Text formatting
  word_boost: [
    // Technical terms commonly used in programming interviews
    'javascript', 'python', 'react', 'nodejs', 'database', 'api',
    'algorithm', 'data structure', 'object oriented', 'function',
    'variable', 'array', 'string', 'boolean', 'integer', 'framework',
    'library', 'backend', 'frontend', 'fullstack', 'debugging',
    'testing', 'deployment', 'version control', 'git', 'github',
    'sql', 'nosql', 'mongodb', 'express', 'angular', 'vue',
    'typescript', 'async', 'await', 'promise', 'callback',
    'rest api', 'graphql', 'microservices', 'docker', 'aws'
  ],
  
  // Real-time processing
  disable_partial_transcripts: false, // Enable partial results
  
  // Audio enhancement
  audio_start_from: 0,
  audio_end_at: null,
  
  // Speaker identification (optional)
  speaker_labels: false, // Set to true if multiple speakers
  
  // Content filtering
  filter_profanity: false, // Keep true responses
  
  // Model selection - AssemblyAI automatically uses best model
  speech_model: 'best', // Uses the most accurate model available
};

// You'll need to set your AssemblyAI API key
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '4c57bc7becea4bf68610f959a745ab0d';

function createSpeechStream(callbacks = {}) {
  let socket = null;
  let transcribed = "";
  let isStreamActive = false;
  let sessionId = null;
  
  // Destructure callbacks with defaults
  const {
    onPartialTranscript = () => {},
    onFinalTranscript = () => {},
    onError = () => {},
    onStreamStart = () => {},
    onStreamEnd = () => {},
  } = callbacks;

  function startStream() {
    if (isStreamActive) {
      console.warn('🚫 Speech stream already active');
      return false;
    }

    console.log('🎙️ Starting AssemblyAI speech recognition stream');
    
    try {
      isStreamActive = true;
      transcribed = "";
      
      // Create WebSocket connection to AssemblyAI
      const websocketUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${ENHANCED_SPEECH_CONFIG.sample_rate}&token=${ASSEMBLYAI_API_KEY}`;
      
      socket = new WebSocket(websocketUrl);
      
      socket.onopen = () => {
        console.log('✅ AssemblyAI WebSocket connection opened');
        sessionId = Date.now().toString(); // Simple session ID
        onStreamStart();
      };

      socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          
          if (data.error) {
            console.error('AssemblyAI error:', data.error);
            onError(new Error(data.error), 'AssemblyAI error occurred');
            return;
          }

          if (data.message_type === 'SessionBegins') {
            console.log('📝 AssemblyAI session began:', data.session_id);
            sessionId = data.session_id;
          } else if (data.message_type === 'PartialTranscript') {
            const transcript = data.text;
            if (transcript && transcript.trim()) {
              console.log(`📝 Partial Transcript: ${transcript}`);
              onPartialTranscript(transcript);
            }
          } else if (data.message_type === 'FinalTranscript') {
            const transcript = data.text;
            if (transcript && transcript.trim()) {
              console.log(`📝 Final Transcript: ${transcript}`);
              transcribed += transcript + " ";
              onFinalTranscript(transcript);
            }
          } else if (data.message_type === 'SessionTerminated') {
            console.log('🏁 AssemblyAI session terminated');
            isStreamActive = false;
            onStreamEnd(transcribed.trim());
          }
        } catch (dataErr) {
          console.error('Error processing AssemblyAI data:', dataErr);
          onError(dataErr, 'Error processing speech data');
        }
      };

      socket.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        isStreamActive = false;
        onError(error, 'AssemblyAI WebSocket error');
        endStream();
      };

      socket.onclose = (event) => {
        console.log('🔒 AssemblyAI WebSocket closed:', event.code, event.reason);
        isStreamActive = false;
        if (event.code !== 1000) { // Not a normal closure
          onError(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`), 'Connection closed');
        }
      };

      return true;

    } catch (err) {
      console.error('Error starting AssemblyAI speech stream:', err);
      isStreamActive = false;
      onError(err, 'Failed to start speech recognition');
      return false;
    }
  }

  function writeAudio(chunk) {
    try {
      if (socket && socket.readyState === WebSocket.OPEN && isStreamActive) {
        // AssemblyAI expects base64 encoded audio data
        let audioData;
        
        if (Buffer.isBuffer(chunk)) {
          audioData = chunk.toString('base64');
        } else if (chunk instanceof ArrayBuffer) {
          audioData = Buffer.from(chunk).toString('base64');
        } else if (chunk instanceof Uint8Array) {
          audioData = Buffer.from(chunk).toString('base64');
        } else {
          // Assume it's already base64 or string
          audioData = chunk.toString();
        }

        socket.send(JSON.stringify({
          audio_data: audioData
        }));
        
        return true;
      } else {
        console.warn('Attempted to write audio but WebSocket is not ready or stream is not active');
        return false;
      }
    } catch (err) {
      console.error('Error writing audio chunk:', err);
      onError(err, 'Error processing audio chunk');
      return false;
    }
  }

  function endStream() {
    console.log('🛑 User called endStream() in speechhandler so ending AssemblyAI stream');
    
    const finalTranscript = transcribed.trim();
    
    // Cleanup
    isStreamActive = false;

    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Send terminate message to AssemblyAI
        socket.send(JSON.stringify({
          terminate_session: true
        }));
        
        // Close the WebSocket connection
        socket.close(1000, 'Stream ended by user');
        socket = null;
      }
    } catch (err) {
      console.error('Error ending AssemblyAI stream:', err);
    }

    transcribed = "";
    onStreamEnd(finalTranscript);
  }

  function getAccumulatedTranscript() {
    return transcribed.trim();
  }

  function isActive() {
    return isStreamActive;
  }

  return { 
    startStream, 
    writeAudio, 
    endStream, 
    getAccumulatedTranscript,
    isActive 
  };
}

export { createSpeechStream };