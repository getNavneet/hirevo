import { getQuestionRulesByLevel } from "./promptLevel.js";

function createQuestionGenerationPrompt(sessionContext) {
  const { conversationHistory, interviewGoals } = sessionContext;
  const { criticalRules, questionTypeToPrioritize, assessementFocus } =
    getQuestionRulesByLevel(interviewGoals.targetLevel);
  let systemPrompt = "";
  let userPrompt = "";

  if (interviewGoals.interviewFor == "core") {
    systemPrompt = `You are an experienced senior technical interviewer conducting a ${
      interviewGoals.primaryTopic
    } interview for a ${interviewGoals.targetLevel} candidate applying for ${
      interviewGoals.targetPosition || "Technical Role"
    } positions.

INTERVIEW PHILOSOPHY:
- Create a conversational, supportive atmosphere while maintaining professionalism
- Focus on understanding the candidate's thought process and communication skills
- Adapt question complexity based on previous responses
- Encourage elaboration and follow-up naturally
- Generate EXACTLY ONE question at a time about ${
      interviewGoals.primaryTopic
    } and related concepts


CRITICAL RULES:
${criticalRules}

QUESTION TYPES TO PRIORITIZE:
${questionTypeToPrioritize}

ASSESSMENT FOCUS:
${assessementFocus}

TONE GUIDELINES:
- Be encouraging and supportive, especially for fresher-level candidates
- Use phrases like "That's interesting, let me dig deeper..." or "Building on what you said..."
- Show genuine interest in their responses
- Provide gentle guidance if they struggle without giving away answers`;
    //user prompt
    userPrompt = `INTERVIEW CONTEXT:
Topic: ${interviewGoals.primaryTopic}
Position: ${interviewGoals.targetPosition || "Technical Role"}

CANDIDATE PROFILE:
${
  interviewGoals.candidateBackground
    ? `Background: ${interviewGoals.candidateBackground}`
    : "Background: Fresh graduate/Entry-level candidate"
}
${
  interviewGoals.specificSkills
    ? `Key Skills: ${interviewGoals.specificSkills}`
    : ""
}
${
  interviewGoals.resumeHighlights
    ? `Resume Highlights: ${interviewGoals.resumeHighlights}`
    : ""
}

SESSION STATUS:
Questions Asked: ${conversationHistory.length}

CONVERSATION HISTORY:
${formatConversationForQuestion(conversationHistory)}

ADAPTIVE INSTRUCTIONS:
${generateAdaptiveInstructions(conversationHistory)}

${coreCurrentStage(conversationHistory)}

Generate the most valuable next question for this ${
      interviewGoals.primaryTopic
    } interview that:
1. Builds naturally on the conversation flow
2. Matches the candidate's demonstrated skill level
3. Explores new aspects while connecting to previous topics
4. Feels like a natural progression a human interviewer would make`;
  } else if (interviewGoals.interviewFor == "resume") {
    systemPrompt = `${core_system_prompt}`;
    userPrompt = `${core_user_prompt}`;
  } else if (interviewGoals.interviewFor == "personal") {
    systemPrompt = `${core_system_prompt}`;
    userPrompt = `${core_user_prompt}`;
  } else {
    console.log("unsupported interview type: ", interviewGoals.interviewFor);
  }

  return { system: systemPrompt, user: userPrompt };
}

function formatConversationForQuestion(history) {
  if (!history || history.length === 0) {
    return "No previous questions. Starting the interview by initially asking brief introduction about user.";
  }

  return history
    .map((entry, index) => {
      return `Q${index + 1}: ${entry.question}
A${index + 1}: ${entry.response || "[No response yet]"}`;
    })
    .join("\n\n");
}

function generateAdaptiveInstructions(conversationHistory) {
  const questionsAsked = conversationHistory.length;

  if (questionsAsked === 0) {
    return "Start with a warm greeting and brief introduction about user.";
  } else if (questionsAsked < 3) {
    return "Focus on fundamental concepts and gauge the candidate's baseline knowledge level.";
  } else if (questionsAsked < 6) {
    return "Dive deeper into their understanding and introduce practical scenarios.";
  } else if (questionsAsked < 9) {
    return "Explore advanced concepts and real-world problem-solving abilities.";
  } else {
    return "Begin wrapping up with challenging questions that reveal depth of expertise.";
  }
}

// Enhanced system message for different interview stages:

function coreCurrentStage(conversationHistory) {
  const coreStageSpecificPrompts = {
    opening: `As the interviewer, begin this mock interview with a warm greeting and asking a brief introduction about user. 
Do not ask any technical or conceptual questions yet—just focus on making the candidate feel comfortable and set a positive, friendly tone for the rest of the interview.`,
    exploration:
      "Ask probing questions that reveal depth of understanding and practical experience.",
    challenge:
      "Present realistic scenarios that test problem-solving skills and decision-making ability.",
    closing:
      "Focus on advanced topics that differentiate strong candidates from average ones.",
  };
  const coreCurrentStage =
    conversationHistory.length < 2
      ? "opening"
      : conversationHistory.length < 6
      ? "exploration"
      : conversationHistory.length < 10
      ? "challenge"
      : "closing";

  return `\n\nCURRENT STAGE: ${coreCurrentStage.toUpperCase()}
STAGE GUIDANCE: ${coreStageSpecificPrompts[coreCurrentStage]}`;
}

export { createQuestionGenerationPrompt };
