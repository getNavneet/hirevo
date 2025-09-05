// Generate next interview question
import OpenAI from "openai";
import {createQuestionGenerationPrompt} from './prompts.js'

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API,
});


async function generateInterviewQuestion(sessionContext,options={}) {
  try {

    const {
      model = 'gpt-4',  //  gpt-4 ,gpt-5,gpt-4o-mini
      temperature = 0.7,
      maxTokens = 300
    } = options;

    //get prompt accordingly
    const prompt = createQuestionGenerationPrompt(sessionContext);
     //integrate this into askLLM.js
     console.log(prompt)
    const response = await openai.chat.completions.create({
      model: model, 
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
    });

    const questionText = response.choices[0].message.content.trim();

    return {
      questionId: generateQuestionId(),
      question: questionText,
      difficulty: "medium",  // you can enhance this later
    };

  } catch (error) {
    console.error("Error generating question:", error);
    return {
      questionId: generateQuestionId(),
      question: "Fallback: Can you tell me about your experience with this technology?",
      difficulty: "medium",
    };
  }
}
function generateQuestionId() {
  return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export {generateInterviewQuestion}