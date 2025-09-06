import { SpeechClient } from '@google-cloud/speech';
import stream from 'stream';

const ENHANCED_SPEECH_CONFIG = {
  encoding: 'WEBM_OPUS', // or 'LINEAR16' for better quality
  sampleRateHertz: 48000, // Higher sample rate for better quality
  languageCode: 'en-IN', // Indian English - adjust based on your region
  alternativeLanguageCodes: ['en-US', 'en-GB'], // Fallback languages
  
  // Enable advanced features for better accuracy
  enableAutomaticPunctuation: true,
  enableWordTimeOffsets: true,
  enableWordConfidence: true,
  enableSpeakerDiarization: false, // Turn on if multiple speakers
  
  // Audio enhancement features
  audioChannelCount: 1,
  enableSeparateRecognitionPerChannel: false,
  
  // Model selection for better accuracy
  model: 'latest_long', // Options: 'latest_long', 'latest_short', 'command_and_search'
  useEnhanced: true, // Use enhanced models (may cost more)
  
  // Adaptation and context
  speechContexts: [{
    phrases: [
      // Technical terms commonly used in programming interviews
      'JavaScript', 'Python', 'React', 'Node.js', 'database', 'API',
      'algorithm', 'data structure', 'object oriented', 'function',
      'variable', 'array', 'string', 'boolean', 'integer', 'framework',
      'library', 'backend', 'frontend', 'full stack', 'debugging',
      'testing', 'deployment', 'version control', 'Git', 'GitHub',
      'SQL', 'NoSQL', 'MongoDB', 'Express', 'Angular', 'Vue',
      'TypeScript', 'async', 'await', 'promise', 'callback',
      'REST API', 'GraphQL', 'microservices', 'Docker', 'AWS',
      // Common Indian names and terms
      'Pradesh', 'Rajasthan', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai',
      'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'
    ],
    boost: 20.0 // Higher boost for technical terms
  }],
  
  // Profanity filter and content filtering
  profanityFilter: false, // Keep true responses
  
  // Metadata for better processing
  metadata: {
    interactionType: 'DISCUSSION', // Options: DISCUSSION, PRESENTATION, PHONE_CALL
    industryNanosCode: 541511, // Software publishers
    microphoneDistance: 'NEARFIELD', // NEARFIELD, MIDFIELD, FARFIELD
    originalMediaType: 'AUDIO', 
    recordingDeviceType: 'PC', // PC, PHONE, OUTDOOR
    recordingDeviceName: 'Interview Microphone',
  }
};


const speechClient = new SpeechClient();// in this we can give env file

function createSpeechStream(callbacks = {}) {
  let recognizeStream = null;
  let audioInput = null;
  let transcribed = "";
  let isStreamActive = false;
  
  // Destructure callbacks with defaults
  const {
    onPartialTranscript = () => {},
    onFinalTranscript = () => {},
    onError = () => {},
    onStreamStart = () => {},
    onStreamEnd = () => {},
  } = callbacks;

  const requestConfig = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      model: 'latest_long',
      enableAutomaticPunctuation: true,
    },
    interimResults: true, // Enable for partial transcripts
  };

  function startStream() {
    if (isStreamActive) {
      console.warn('🚫 Speech stream already active');
      return false;
    }

    console.log('🎙️ Starting speech recognition stream');
    
    try {
      isStreamActive = true;
      transcribed = "";
      audioInput = new stream.PassThrough();
      
      onStreamStart();

      recognizeStream = speechClient
        .streamingRecognize({
          config: ENHANCED_SPEECH_CONFIG,
          interimResults: true
        })
        .on('error', (err) => {
          console.error('Google Speech error:', err);
          isStreamActive = false;
          onError(err, 'Google STT error occurred');
          endStream();
        })
        .on('data', (data) => {
          try {
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              const transcript = result.alternatives[0]?.transcript;
              const isFinal = result.isFinal;

              if (transcript) {
                console.log(`📝 ${isFinal ? 'Final' : 'Partial'} Transcript: ${transcript}`);

                if (isFinal) {
                  transcribed += transcript + " ";
                  // it automatically create final when a small pause it there in a speech
                  // Send individual final transcript
                  onFinalTranscript(transcript);
                } else {
                  // Send partial transcript for real-time feedback
                  onPartialTranscript(transcript);
                }
              }
            }
          } catch (dataErr) {
            console.error('Error processing speech data:', dataErr);
            onError(dataErr, 'Error processing speech data');
          }
        })
        .on('end', () => {
          console.log('🏁 Speech recognition stream ended');
          isStreamActive = false;
          onStreamEnd(transcribed.trim());
        })
        .on('close', () => {
          console.log('🔒 Speech recognition stream closed');
          isStreamActive = false;
        });

      // Pipe audio to recognize stream
      audioInput.pipe(recognizeStream);
      return true;

    } catch (err) {
      console.error('Error starting speech stream:', err);
      isStreamActive = false;
      onError(err, 'Failed to start speech recognition');
      return false;
    }
  }

  function writeAudio(chunk) {
    try {
      if (audioInput && isStreamActive) {
        audioInput.write(chunk);
        return true;
      } else {
        console.warn('Attempted to write audio but stream is not active');
        return false;
      }
    } catch (err) {
      console.error('Error writing audio chunk:', err);
      onError(err, 'Error processing audio chunk');
      return false;
    }
  }

  function endStream() {
    console.log('🛑 Ending speech stream');
    
    const finalTranscript = transcribed.trim();
    
    // Cleanup
    isStreamActive = false;

    try {
      if (audioInput) {
        audioInput.end();
        audioInput = null;
      }
    } catch (err) {
      console.error('Error ending audio input:', err);
    }

    try {
      if (recognizeStream) {
        recognizeStream.removeAllListeners();
        recognizeStream.end();
        recognizeStream = null;
      }
    } catch (err) {
      console.error('Error ending recognize stream:', err);
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