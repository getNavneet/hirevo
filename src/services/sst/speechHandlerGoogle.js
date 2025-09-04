import { SpeechClient } from '@google-cloud/speech';
import stream from 'stream';

const speechClient = new SpeechClient();

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
      sampleRateHertz: 48000,
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
        .streamingRecognize(requestConfig)
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