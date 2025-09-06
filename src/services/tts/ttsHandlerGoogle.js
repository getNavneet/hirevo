import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const ttsClient = new TextToSpeechClient();


async function synthesizeSpeech(text) {
  const request = {
    input: { text: text },
    voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-B' }, //en-IN-Wavenet-A (female),en-IN-Wavenet-B
    audioConfig: { audioEncoding: 'MP3' },
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
