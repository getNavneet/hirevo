import WebSocket from 'ws';
// const querystring = require("querystring");
import querystring from "querystring";

const ENHANCED_SPEECH_CONFIG = {
  // Audio configuration
  sample_rate: 48000, // Higher sample rate for better quality
  encoding: 'pcm_s16le', // PCM 16-bit little-endian (required format)
  
  // Enhanced features for better accuracy
  format_turns: true, // Enable text formatting
  
  // Voice agent optimization settings
  min_end_of_turn_silence_when_confident: 560, // ms - good for multi-speaker scenarios
  end_of_turn_confidence_threshold: 0.5, // 0.0 to 1.0
  max_silence_before_end_of_turn: 2000, // ms
  
  // Word boost for technical terms
  word_boost: [
    'javascript', 'python', 'react', 'nodejs', 'database', 'api',
    'algorithm', 'data structure', 'object oriented', 'function',
    'variable', 'array', 'string', 'boolean', 'integer', 'framework',
    'library', 'backend', 'frontend', 'fullstack', 'debugging',
    'testing', 'deployment', 'version control', 'git', 'github',
    'sql', 'nosql', 'mongodb', 'express', 'angular', 'vue',
    'typescript', 'async', 'await', 'promise', 'callback',
    'rest api', 'graphql', 'microservices', 'docker', 'aws'
  ],
  
  // Additional parameters
  disable_partial_transcripts: false // Enable real-time partial transcripts
};
const CONNECTION_PARAMS = {
  sample_rate: 16000,
  format_turns: true, // Request formatted final transcripts
};

// You'll need to set your AssemblyAI API key
// const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_KEY = 'd07d3cbf69fe439483254def94d20056';

if (!ASSEMBLYAI_API_KEY) {
  console.error('❌ ASSEMBLYAI_API_KEY environment variable is not set!');
  throw new Error('AssemblyAI API key is required');
}

// AssemblyAI WebSocket endpoint
// const WEBSOCKET_URL = 'wss://api.assemblyai.com/v2/realtime/ws';
const WEBSOCKET_URL = 'wss://streaming.assemblyai.com/v3/ws';

function createSpeechStream(callbacks = {}) {
  let socket = null;
  let transcribed = "";
  let isStreamActive = false;
  let isWebSocketReady = false;
  let sessionId = null;
  let audioQueue = []; // Queue audio chunks until WebSocket is ready
  
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
      
      // Create WebSocket connection to AssemblyAI with proper authentication
      const websocketUrl = `${WEBSOCKET_URL}?${querystring.stringify(CONNECTION_PARAMS)}`;
      
      socket = new WebSocket(websocketUrl, {
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
    },
  });
     

      socket.onopen = () => {
        console.log('✅ AssemblyAI WebSocket connection opened');
        isWebSocketReady = true;
        
        // Send configuration after connection opens
        const config = {
          sample_rate: ENHANCED_SPEECH_CONFIG.sample_rate,
          encoding: ENHANCED_SPEECH_CONFIG.encoding,
          format_turns: ENHANCED_SPEECH_CONFIG.format_turns,
          min_end_of_turn_silence_when_confident: ENHANCED_SPEECH_CONFIG.min_end_of_turn_silence_when_confident,
          end_of_turn_confidence_threshold: ENHANCED_SPEECH_CONFIG.end_of_turn_confidence_threshold,
          max_silence_before_end_of_turn: ENHANCED_SPEECH_CONFIG.max_silence_before_end_of_turn,
          disable_partial_transcripts: ENHANCED_SPEECH_CONFIG.disable_partial_transcripts
        };
        
        // Add word_boost if available
        // if (ENHANCED_SPEECH_CONFIG.word_boost && ENHANCED_SPEECH_CONFIG.word_boost.length > 0) {
        //   config.word_boost = ENHANCED_SPEECH_CONFIG.word_boost;
        // }
        
        // socket.send(querystring.stringify(config));
        
        // Process any queued audio chunks
        while (audioQueue.length > 0) {
          const queuedChunk = audioQueue.shift();
          writeAudioInternal(queuedChunk);
        }
        
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
            // Handle partial transcripts (real-time updates)
            const transcript = data.text;
            if (transcript && transcript.trim()) {
              console.log(`📝 Partial Transcript: ${transcript}`);
              onPartialTranscript(transcript);
            }
            
          } else if (data.message_type === 'FinalTranscript') {
            // Handle final transcripts (completed utterances)
            const transcript = data.text;
            if (transcript && transcript.trim()) {
              console.log(`📝 Final Transcript: ${transcript}`);
              transcribed += transcript + " ";
              onFinalTranscript(transcript);
            }
            
          } else if (data.message_type === 'SessionTerminated') {
            console.log('🏁 AssemblyAI session terminated');
            isStreamActive = false;
            isWebSocketReady = false;
            onStreamEnd(transcribed.trim());
            
          } else {
            // Handle other message types (Turn events, etc.)
            console.log('📨 Received message:', data.message_type, data);
          }
          
        } catch (dataErr) {
          console.error('Error processing AssemblyAI data:', dataErr);
          onError(dataErr, 'Error processing speech data');
        }
      };

      socket.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        isStreamActive = false;
        isWebSocketReady = false;
        audioQueue = []; // Clear queue on error
        onError(error, 'AssemblyAI WebSocket error');
        endStream();
      };

      socket.onclose = (event) => {
        console.log('🔒 AssemblyAI WebSocket closed:', event.code, event.reason);
        isStreamActive = false;
        isWebSocketReady = false;
        audioQueue = []; // Clear queue on close
        
        if (event.code === 4001) {
          onError(new Error('Invalid AssemblyAI API key or authentication failed'), 'Authentication error - Please check your API key');
        } else if (event.code === 4002) {
          onError(new Error('Insufficient funds in AssemblyAI account'), 'Payment error - Please check your account balance');
        } else if (event.code === 4000) {
          onError(new Error('Sample rate must be a positive integer'), 'Invalid sample rate');
        } else if (event.code !== 1000) { // Not a normal closure
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

  function writeAudioInternal(chunk) {
    try {
      if (socket && socket.readyState === WebSocket.OPEN && isWebSocketReady) {
        // AssemblyAI expects raw PCM audio data as base64
        let audioData;
        
        if (Buffer.isBuffer(chunk)) {
          // Convert PCM buffer to base64
          audioData = chunk.toString('base64');
        } else if (chunk instanceof ArrayBuffer) {
          audioData = Buffer.from(chunk).toString('base64');
        } else if (chunk instanceof Uint8Array) {
          audioData = Buffer.from(chunk).toString('base64');
        } else if (typeof chunk === 'string') {
          // Assume it's already base64
          audioData = chunk;
        } else {
          console.error('Unsupported audio chunk format:', typeof chunk);
          return false;
        }

        // Send audio data in the format expected by AssemblyAI
        socket.send(JSON.stringify({
          audio_data: audioData
        }));
        
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Error sending audio chunk:', err);
      return false;
    }
  }

  function writeAudio(chunk) {
    try {
      if (!isStreamActive) {
        console.warn('Attempted to write audio but stream is not active');
        return false;
      }

      if (isWebSocketReady && socket && socket.readyState === WebSocket.OPEN) {
        // WebSocket is ready, send immediately
        return writeAudioInternal(chunk);
      } else if (isStreamActive) {
        // Stream is active but WebSocket not ready yet, queue the audio
        console.log('⏳ Queueing audio chunk until WebSocket is ready');
        audioQueue.push(chunk);
        return true;
      } else {
        console.warn('Attempted to write audio but WebSocket is not ready');
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
    isWebSocketReady = false;
    audioQueue = []; // Clear any remaining queued audio

    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Send terminate message to AssemblyAI
        socket.send(JSON.stringify({
          terminate_session: true
        }));
        
        // Give a small delay for the message to send, then close
        setTimeout(() => {
          if (socket) {
            socket.close(1000, 'Stream ended by user');
            socket = null;
          }
        }, 100);
      } else {
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