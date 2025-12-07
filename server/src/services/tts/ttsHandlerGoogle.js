import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const ttsClient = new TextToSpeechClient();


async function synthesizeSpeech(text, options = {}) {

  const defaultSettings = {
    volumeGainDb: 0.0,     // Volume: -96.0 to 16.0 dB
    speakingRate: 1.0,     // Speed: 0.25 to 4.0 (1.0 = normal)
    pitch: 0.0,            // Pitch: -20.0 to 20.0 semitones
    audioEncoding: 'MP3'   // Audio format
  };

  // Merge user options with defaults
  const audioSettings = { ...defaultSettings, ...options };


  const request = {
    input: { text: text },
    voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-B' }, //en-IN-Wavenet-A (female),en-IN-Wavenet-B
    audioConfig: {
      audioEncoding: audioSettings.audioEncoding,
      volumeGainDb: audioSettings.volumeGainDb,
      speakingRate: audioSettings.speakingRate,
      pitch: audioSettings.pitch
    },
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);
    console.log('🔊 Speech synthesized successfully.');
    return response.audioContent;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new Error('Failed to synthesize speech.');
  }
}

export { synthesizeSpeech };


// Louder and faster
// const audio2 = await synthesizeSpeech("This is louder and faster!", {
//   volumeGainDb: 6.0,
//   speakingRate: 1.5
// });

// Quieter, slower, and lower pitch
// const audio3 = await synthesizeSpeech("This is quieter, slower, and deeper.", {
//   volumeGainDb: -10.0,
//   speakingRate: 0.8,
//   pitch: -5.0
// });

// Higher pitch and very fast
// const audio4 = await synthesizeSpeech("This sounds chipmunk-like!", {
//   speakingRate: 2.0,
//   pitch: 10.0
// });