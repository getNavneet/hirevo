import { AssemblyAI } from 'assemblyai';

const ENHANCED_SPEECH_CONFIG = {
  // Audio configuration - matching official SDK patterns
  sampleRate: 48000, // Higher sample rate for better quality
  
  // Enhanced features for better accuracy
  formatTurns: true, // Enable text formatting (matches SDK's formatTurns)
  
  // Voice agent optimization settings
  endUtteranceSilenceThreshold: 560, // ms - good for multi-speaker scenarios
  
  // Word boost for technical terms (if supported in future)
  wordBoost: [
    'javascript', 'python', 'react', 'nodejs', 'database', 'api',
    'algorithm', 'data structure', 'object oriented', 'function',
    'variable', 'array', 'string', 'boolean', 'integer', 'framework',
    'library', 'backend', 'frontend', 'fullstack', 'debugging',
    'testing', 'deployment', 'version control', 'git', 'github',
    'sql', 'nosql', 'mongodb', 'express', 'angular', 'vue',
    'typescript', 'async', 'await', 'promise', 'callback',
    'rest api', 'graphql', 'microservices', 'docker', 'aws'
  ]
};

// You'll need to set your AssemblyAI API key
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  console.error('❌ ASSEMBLYAI_API_KEY environment variable is not set!');
  throw new Error('AssemblyAI API key is required');
}

// Create AssemblyAI client
const client = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY
});

function createSpeechStream(callbacks = {}) {
  let transcriber = null;
  let transcribed = "";
  let isStreamActive = false;
  let isTranscriberReady = false;
  let sessionId = null;
  let audioQueue = []; // Queue audio chunks until transcriber is ready
  let writerStream = null;
  
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
    console.log('🔑 API Key configured:', !!ASSEMBLYAI_API_KEY);
    console.log('📊 Sample rate:', ENHANCED_SPEECH_CONFIG.sampleRate);
    
    try {
      isStreamActive = true;
      transcribed = "";
      
      // Create streaming transcriber using official SDK
      transcriber = client.streaming.transcriber({
        sampleRate: ENHANCED_SPEECH_CONFIG.sampleRate,
        formatTurns: ENHANCED_SPEECH_CONFIG.formatTurns,
        // Add other configuration options as supported by SDK
      });

      // Set up event handlers - matching official SDK patterns
      transcriber.on("open", ({ id, sessionId: sid }) => {
        console.log(`✅ AssemblyAI session opened with ID: ${id}`);
        sessionId = id || sid;
        isTranscriberReady = true;
        
        // Process any queued audio chunks
        processQueuedAudio();
        
        onStreamStart();
      });

      transcriber.on("error", (error) => {
        console.error('❌ AssemblyAI transcriber error:', error);
        isStreamActive = false;
        isTranscriberReady = false;
        audioQueue = [];
        onError(error, 'AssemblyAI transcriber error occurred');
        cleanup();
      });

      transcriber.on("close", (code, reason) => {
        console.log('🔒 AssemblyAI session closed:', code, reason);
        isStreamActive = false;
        isTranscriberReady = false;
        audioQueue = [];
        
        if (code && code !== 1000) {
          const errorMsg = getErrorMessage(code, reason);
          onError(new Error(errorMsg), 'Session closed unexpectedly');
        }
      });

      // Handle turn events (this is where we get transcriptions)
      transcriber.on("turn", (turn) => {
        try {
          if (!turn.transcript || !turn.transcript.trim()) {
            return;
          }

          const transcript = turn.transcript.trim();
          console.log(`📝 Turn received: ${transcript}`);
          console.log(`📊 Turn details:`, {
            transcript: transcript,
            words: turn.words?.length || 0,
            confidence: turn.confidence,
            is_final: turn.is_final
          });

          // Add to accumulated transcript
          transcribed += transcript + " ";

          // Send as final transcript (AssemblyAI turns are generally final)
          onFinalTranscript(transcript);
          
        } catch (turnErr) {
          console.error('Error processing turn:', turnErr);
          onError(turnErr, 'Error processing transcription turn');
        }
      });

      // Handle partial transcripts if available
      transcriber.on("transcript", (transcript) => {
        try {
          if (transcript && transcript.text && transcript.text.trim()) {
            const text = transcript.text.trim();
            console.log(`📝 Transcript: ${text} (confidence: ${transcript.confidence})`);
            
            if (transcript.message_type === 'PartialTranscript') {
              onPartialTranscript(text);
            } else if (transcript.message_type === 'FinalTranscript') {
              transcribed += text + " ";
              onFinalTranscript(text);
            }
          }
        } catch (transcriptErr) {
          console.error('Error processing transcript:', transcriptErr);
          onError(transcriptErr, 'Error processing transcript');
        }
      });

      // Connect to AssemblyAI
      console.log("📡 Connecting to AssemblyAI streaming service");
      transcriber.connect().then(() => {
        console.log("✅ Successfully connected to AssemblyAI");
      }).catch((connectErr) => {
        console.error("❌ Failed to connect to AssemblyAI:", connectErr);
        isStreamActive = false;
        onError(connectErr, 'Failed to connect to AssemblyAI');
      });

      return true;

    } catch (err) {
      console.error('Error starting AssemblyAI speech stream:', err);
      isStreamActive = false;
      onError(err, 'Failed to start speech recognition');
      return false;
    }
  }

  function processQueuedAudio() {
    if (!isTranscriberReady || !transcriber) {
      return;
    }

    console.log(`📦 Processing ${audioQueue.length} queued audio chunks`);
    while (audioQueue.length > 0) {
      const queuedChunk = audioQueue.shift();
      writeAudioInternal(queuedChunk);
    }
  }

  function writeAudioInternal(chunk) {
    try {
      if (!transcriber || !isTranscriberReady) {
        console.warn('❌ Transcriber not ready in writeAudioInternal');
        return false;
      }

      // Get the writer stream if we don't have it yet
      if (!writerStream) {
        writerStream = transcriber.stream().getWriter();
      }

      // Convert chunk to appropriate format
      let audioData;
      
      if (Buffer.isBuffer(chunk)) {
        audioData = new Uint8Array(chunk);
      } else if (chunk instanceof ArrayBuffer) {
        audioData = new Uint8Array(chunk);
      } else if (chunk instanceof Uint8Array) {
        audioData = chunk;
      } else {
        console.error('Unsupported audio chunk format:', typeof chunk);
        return false;
      }

      // Write to the stream
      writerStream.write(audioData);
      return true;
      
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

      if (isTranscriberReady && transcriber) {
        // Transcriber is ready, send immediately
        return writeAudioInternal(chunk);
      } else if (isStreamActive) {
        // Stream is active but transcriber not ready yet, queue the audio
        console.log('⏳ Queueing audio chunk until transcriber is ready');
        audioQueue.push(chunk);
        return true;
      } else {
        console.warn('Attempted to write audio but transcriber is not ready');
        return false;
      }
    } catch (err) {
      console.error('Error writing audio chunk:', err);
      onError(err, 'Error processing audio chunk');
      return false;
    }
  }

  function cleanup() {
    try {
      if (writerStream) {
        writerStream.close?.();
        writerStream = null;
      }
    } catch (err) {
      console.error('Error closing writer stream:', err);
    }
  }

  function endStream() {
    console.log('🛑 User called endStream() in speechhandler so ending AssemblyAI stream');
    
    const finalTranscript = transcribed.trim();
    
    // Cleanup
    isStreamActive = false;
    isTranscriberReady = false;
    audioQueue = [];

    try {
      if (transcriber) {
        console.log('📤 Closing AssemblyAI transcriber');
        
        // Close the writer stream first
        cleanup();
        
        // Close the transcriber
        transcriber.close().then(() => {
          console.log('✅ AssemblyAI transcriber closed successfully');
        }).catch((closeErr) => {
          console.error('❌ Error closing AssemblyAI transcriber:', closeErr);
        });
        
        transcriber = null;
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

  function getErrorMessage(code, reason) {
    switch (code) {
      case 4001:
        return 'Invalid AssemblyAI API key or authentication failed';
      case 4002:
        return 'Insufficient funds in AssemblyAI account';
      case 4000:
        return 'Invalid sample rate or configuration';
      default:
        return `Connection closed: ${code} ${reason}`;
    }
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