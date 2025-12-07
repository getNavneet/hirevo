import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API,
});

async function synthesizeSpeech(text) {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1", // 
      voice: "nova", // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      input: text,
      response_format: "mp3",
    });

    console.log('🔊 Speech synthesized successfully.');

    // OpenAI returns a stream. We need to convert it to a Buffer.
    const audioStream = response.body;
    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    
    return audioBuffer;

  } catch (error) {
    console.error('Error synthesizing speech with OpenAI:', error);
    throw new Error('Failed to synthesize speech.');
  }
}

export { synthesizeSpeech };
