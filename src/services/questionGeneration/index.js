import OpenAI from "openai";
import { generateInterviewQuestion } from "./askLLm.js";



// ==================== SESSION MANAGEMENT ====================

// Initialize new interview session
function createInterviewSession(interviewGoals, candidateProfile = {}) {
  return {
    sessionId: generateSessionId(),
    interviewGoals,
    candidateProfile,
    conversationHistory: [],
    sessionMetrics: {
      questionsAsked: 0,
      questionsAnswered: 0,
      currentStatus: 'active'
    }
  };
}

// Add question to session
function addQuestionToSession(sessionContext, questionData) {
  const updatedHistory = [...sessionContext.conversationHistory];
  
  updatedHistory.push({
    questionId: questionData.questionId,
    question: questionData.question,
    difficulty: questionData.difficulty,
    response: null,
  });

  return {
    ...sessionContext,
    conversationHistory: updatedHistory,
    sessionMetrics: {
      ...sessionContext.sessionMetrics,
      questionsAsked: updatedHistory.length,
    }
  };
}

function addResponseToSession(sessionContext, questionId, userResponse) {
  const updatedHistory = sessionContext.conversationHistory.map(entry => {
    if (entry.questionId === questionId) {
      return {
        ...entry,
        response: userResponse,
      };
    }
    return entry;
  });

  const answeredCount = updatedHistory.filter(h => h.response).length;

  return {
    ...sessionContext,
    conversationHistory: updatedHistory,
    sessionMetrics: {
      ...sessionContext.sessionMetrics,
      questionsAnswered: answeredCount,
    }
  };
}

// ==================== UTILITY FUNCTIONS ====================

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== MAIN WORKFLOW FUNCTIONS ====================

// Complete workflow for processing a response and getting next question
async function processResponseAndGenerateNext(sessionContext, questionId, userResponse) {
  try {
    const sessionWithResponse = addResponseToSession(sessionContext, questionId, userResponse);
    const nextQuestion = await generateInterviewQuestion(sessionWithResponse);
    const shouldWrapUp = shouldEndInterview(sessionWithResponse);
    
    if (shouldWrapUp) {
      return {
        type: 'complete',
        message: "Thank you for the interview. Happy coding",
        updatedSession: sessionWithResponse,
        readyForScoring: true
      };
    }

    const finalSession = addQuestionToSession(sessionWithResponse, nextQuestion);

    return {
      type: 'continue',
      nextQuestion,
      updatedSession: finalSession,
      questionForTTS: nextQuestion.question // Ready for TTS service
    };

  } catch (error) {
    console.error('Error in workflow:', error);
    return {
      type: 'error',
      message: "Technical error occurred. Please try again.",
      error: error.message
    };
  }
}

// Check if interview should end
function shouldEndInterview(sessionContext) {
  const { sessionMetrics, interviewGoals } = sessionContext;

  // End conditions
  const maxQuestions = interviewGoals.maxQuestions || 10;
  
  return (
    sessionMetrics.questionsAsked >= maxQuestions ||
    sessionMetrics.questionsAnswered >= Math.min(maxQuestions, 8)
  );
}

// ==================== EXPORTS ====================

export {
  // Question Generation
  generateInterviewQuestion,

  // Session Management
  createInterviewSession,
  addQuestionToSession,
  addResponseToSession,
  
  // Main Workflow
  processResponseAndGenerateNext,
  
  // Utilities
  generateSessionId,
};
