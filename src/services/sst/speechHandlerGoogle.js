import { SpeechClient } from '@google-cloud/speech';
import stream from 'stream';
const speechClient = new SpeechClient();

function createSpeechStream(socket, onFinalTranscript) {
  let recognizeStream = null;
  let audioInput = null;
  let transcribed = "";

  const requestConfig = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      model: 'latest_long',
      enableAutomaticPunctuation: true,
    },
    interimResults: false,
  };

  function startStream() {
    console.log(`[${socket.id}] 🎙️ Starting speech recognition stream`);
    audioInput = new stream.PassThrough();

    recognizeStream = speechClient
      .streamingRecognize(requestConfig)
      .on('error', (err) => {
        console.error('Google Speech error:', err);
        socket.emit('transcription-error', 'Google STT error occurred');
      })
      .on('data', (data) => {
        const transcript = data.results[0]?.alternatives[0]?.transcript;
        const isFinal = data.results[0]?.isFinal;

        if (transcript) {
          console.log(`[${socket.id}] 📝 Transcript: ${transcript}`);
          transcribed += transcript;

          if (isFinal) {
            socket.emit('transcription', transcript);

            // ✅ pass to LLM or another handler
            if (onFinalTranscript) {
              onFinalTranscript(transcript, socket);
            }
          } else {
            socket.emit('partial-transcription', transcript);
          }
        }
      });

    // pipe audio to recognize stream
    audioInput.pipe(recognizeStream);
    socket.audioInput = audioInput;
  }

  function writeAudio(chunk) {
    if (socket.audioInput) {
      socket.audioInput.write(chunk);
    }
  }

  function endStream() {
    console.log(`[${socket.id}] 🛑 Ending speech stream`);
    transcribed = "";

    if (socket.audioInput) socket.audioInput.end();
    if (recognizeStream) recognizeStream.end();

    socket.audioInput = null;
    recognizeStream = null;
  }

  return { startStream, writeAudio, endStream };
}

export { createSpeechStream };
