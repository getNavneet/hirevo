import { AssemblyAI } from 'assemblyai';
import { Readable } from 'stream';

// Configure AssemblyAI with your API key
// It's recommended to use an environment variable for security
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY, 
});

const ENHANCED_SPEECH_CONFIG = {
  // AssemblyAI configuration options
  sampleRate: 48000, 
  punctuate: true,
  // You can add more options from the AssemblyAI docs
  // Example: 'speaker_labels: true' for speaker diarization
};

function createSpeechStream(callbacks = {}) {
  let transcriber = null;
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

  async function startStream() {
    if (isStreamActive) {
      console.warn('🚫 Speech stream already active');
      return false;
    }

    console.log('🎙️ Starting AssemblyAI speech recognition stream');

    try {
      isStreamActive = true;
      transcribed = "";
      audioInput = new Readable({
        read() {}, // Implement a read method for a readable stream
      });

      onStreamStart();

      transcriber = client.streaming.transcriber({
        sampleRate: ENHANCED_SPEECH_CONFIG.sampleRate,
        punctuate: ENHANCED_SPEECH_CONFIG.punctuate,
        // Add other config options here
      });

      // Connect to the AssemblyAI WebSocket
      await transcriber.connect();

      // Set up event listeners
      transcriber.on('transcript', (transcript) => {
        if (!transcript.text) return;

        // AssemblyAI provides a "text" field for both partial and final transcripts
        // The "isFinal" property determines which it is
        if (transcript.isFinal) {
          transcribed += transcript.text + " ";
          console.log(`📝 Final Transcript: ${transcript.text}`);
          onFinalTranscript(transcript.text);
        } else {
          console.log(`📝 Partial Transcript: ${transcript.text}`);
          onPartialTranscript(transcript.text);
        }
      });

      transcriber.on('error', (err) => {
        console.error('AssemblyAI error:', err);
        isStreamActive = false;
        onError(err, 'AssemblyAI STT error occurred');
        endStream();
      });

      transcriber.on('close', (code, reason) => {
        console.log(`🔒 AssemblyAI stream closed with code ${code}: ${reason}`);
        isStreamActive = false;
        onStreamEnd(transcribed.trim());
      });

      // Pipe the audio input to the transcriber's stream
    //   audioInput.pipe(transcriber.stream());
      audioInput.pipe(transcriber.stream);
      
      return true;

    } catch (err) {
      console.error('Error starting AssemblyAI speech stream:', err);
      isStreamActive = false;
      onError(err, 'Failed to start AssemblyAI recognition');
      return false;
    }
  }

  function writeAudio(chunk) {
    try {
      if (audioInput && isStreamActive) {
        audioInput.push(chunk);
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
    console.log('🛑 user called endStream() in speechhandler, Ending AssemblyAI stream');
    
    const finalTranscript = transcribed.trim();

    try {
      if (audioInput) {
        audioInput.push(null); // End the readable stream
        audioInput = null;
      }
    } catch (err) {
      console.error('Error ending audio input:', err);
    }

    try {
      if (transcriber) {
        transcriber.close();
        transcriber = null;
      }
    } catch (err) {
      console.error('Error ending transcriber:', err);
    }
    
    isStreamActive = false;
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