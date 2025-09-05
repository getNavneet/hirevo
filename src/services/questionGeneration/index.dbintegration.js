import { generateInterviewQuestion } from "./askLLm.js";
import InterviewSession from "../../models/interviewsession.model.js";

// ==================== LEVEL-BASED CONFIGURATION ====================
const LEVEL_CONFIG = {
  beginner: {
    maxQuestions: 8,
    difficulty: ['easy'],
    alias: ['beginner', 'easy', 'basic']
  },
  intermediate: {
    maxQuestions: 12,
    difficulty: ['easy', 'medium'],
    alias: ['intermediate', 'medium', 'mid']
  },
  expert: {
    maxQuestions: 20,
    difficulty: ['medium', 'hard'],
    alias: ['expert', 'hard', 'advanced']
  }
};

// ==================== DATABASE SESSION HELPERS ====================

// Get interview session from database and create workflow context
async function initializeInterviewFromDB(sessionId) {
  try {
    const dbSession = await InterviewSession.findOne({ sessionId });
    
    if (!dbSession) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Normalize level
    const normalizedLevel = normalizeLevel(dbSession.level);
    const levelConfig = LEVEL_CONFIG[normalizedLevel];

    if (!levelConfig) {
      throw new Error(`Invalid level: ${dbSession.level}`);
    }

    // Create interview workflow context
    const interviewGoals = {
      sessionId: dbSession.sessionId,
      primaryTopic: dbSession.category || dbSession.subcategory,
      subcategory: dbSession.subcategory,
      targetLevel: normalizedLevel,
      interviewFor: dbSession.interviewType || 'core', // resume, core, programming, personal
      maxQuestions: levelConfig.maxQuestions,
      allowedDifficulties: levelConfig.difficulty,
      // Add any other goals from database
      ...dbSession.interviewGoals
    };
      //candidate profile if available
    // const candidateProfile = {
    //   resume: dbSession.resume,
    //   experience: dbSession.experience,
    //   skills: dbSession.skills,
    //   // Add any other profile data
    //   ...dbSession.candidateProfile
    // };

    // Create workflow session context
    const workflowSession = createInterviewSession(interviewGoals, candidateProfile);
    
    // If there's existing conversation history, restore it
    if (dbSession.conversationHistory && dbSession.conversationHistory.length > 0) {
      workflowSession.conversationHistory = dbSession.conversationHistory;
      workflowSession.sessionMetrics.questionsAsked = dbSession.conversationHistory.length;
      workflowSession.sessionMetrics.questionsAnswered = dbSession.conversationHistory.filter(q => q.response).length;
    }

    // Store reference to original DB session
    workflowSession.dbSessionId = sessionId;
    workflowSession.dbSession = dbSession;  //if old session in database is there

    return {
      success: true,
      workflowSession,
      dbSession,
      levelConfig
    };

  } catch (error) {
    console.error('Error initializing interview from DB:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Save workflow session back to database
async function saveSessionToDB(workflowSession) {
  try {
    if (!workflowSession.dbSessionId) {
      throw new Error('No database session ID found');
    }

    const updateData = {
      conversationHistory: workflowSession.conversationHistory,
      sessionMetrics: workflowSession.sessionMetrics,
      lastActivity: new Date(),
      status: workflowSession.sessionMetrics.currentStatus || 'active'
    };

    // If interview is complete, add completion data
    if (workflowSession.sessionMetrics.currentStatus === 'completed') {
      updateData.completedAt = new Date();
      updateData.status = 'completed';
    }

    const updatedSession = await InterviewSession.findOneAndUpdate(
      { sessionId: workflowSession.dbSessionId },
      updateData,
      { new: true }
    );

    return {
      success: true,
      updatedSession
    };

  } catch (error) {
    console.error('Error saving session to DB:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

function normalizeLevel(level) {
  if (!level) return 'beginner';
  
  const levelStr = level.toString().toLowerCase();
  
  for (const [key, config] of Object.entries(LEVEL_CONFIG)) {
    if (config.alias.includes(levelStr)) {
      return key;
    }
  }
  
  return 'beginner'; // default fallback
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== SESSION MANAGEMENT ====================

// Initialize new interview session function (enhanced)
function createInterviewSession(interviewGoals, candidateProfile = {}) {
  const sessionId = interviewGoals.sessionId;
  
  return {
    sessionId,
    interviewGoals,
    candidateProfile,
    conversationHistory: [],
    sessionMetrics: {
      questionsAsked: 0,
      questionsAnswered: 0,
      currentStatus: 'active',
      startedAt: new Date(),
      level: interviewGoals.targetLevel,
      maxQuestions: interviewGoals.maxQuestions
    },
    dbSessionId: null, // Will be set when linked to DB session
    dbSession: null
  };
}

// Add question to session
function addQuestionToSession(sessionContext, questionData) {
  const updatedHistory = [...sessionContext.conversationHistory];
  
  updatedHistory.push({
    questionId: questionData.questionId,
    question: questionData.question,
    difficulty: questionData.difficulty,
    topic: questionData.topic || sessionContext.interviewGoals.primaryTopic,
    askedAt: new Date(),
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
        answeredAt: new Date(),
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

// ==================== ENHANCED WORKFLOW FUNCTIONS ====================

// Complete workflow for processing a response and getting next question (enhanced)
async function processResponseAndGenerateNext(sessionContext, questionId, userResponse) {
  try {
    let updatedSession = sessionContext;
    
    // If we have a response to process
    if (questionId && userResponse) {
      updatedSession = addResponseToSession(sessionContext, questionId, userResponse);
    }

    // Check if interview should end
    const shouldWrapUp = shouldEndInterview(updatedSession);
    
    if (shouldWrapUp) {
      updatedSession.sessionMetrics.currentStatus = 'completed';
      updatedSession.sessionMetrics.completedAt = new Date();
      
      // Save final session to database
      if (updatedSession.dbSessionId) {
        await saveSessionToDB(updatedSession);
      }
      
      return {
        type: 'complete',
        message: generateCompletionMessage(updatedSession),
        updatedSession,
        readyForScoring: true
      };
    }

    // Generate next question
    const nextQuestion = await generateInterviewQuestion(updatedSession);
    
    if (!nextQuestion) {
      throw new Error('Failed to generate next question');
    }

    const finalSession = addQuestionToSession(updatedSession, nextQuestion);
    
    // Auto-save to database after each question
    if (finalSession.dbSessionId) {
      await saveSessionToDB(finalSession);
    }

    return {
      type: 'continue',
      nextQuestion,
      updatedSession: finalSession,
      questionForTTS: nextQuestion.question
    };

  } catch (error) {
    console.error('Error in workflow:', error);
    return {
      type: 'error',
      message: "Technical error occurred. Please try again.",
      error: error.message,
      updatedSession: sessionContext
    };
  }
}

// Enhanced interview end check
function shouldEndInterview(sessionContext) {
  const { sessionMetrics, interviewGoals } = sessionContext;
  const maxQuestions = interviewGoals.maxQuestions || 8;
  
  // End conditions based on level and progress
  return (
    sessionMetrics.questionsAsked >= maxQuestions ||
    sessionMetrics.questionsAnswered >= Math.min(maxQuestions, maxQuestions - 1)
  );
}

// Generate completion message based on level and performance
function generateCompletionMessage(sessionContext) {
  const { sessionMetrics, interviewGoals } = sessionContext;
  const level = interviewGoals.targetLevel;
  const answered = sessionMetrics.questionsAnswered;
  const total = sessionMetrics.questionsAsked;
  
  const completionRate = Math.round((answered / total) * 100);
  
  let message = `Thank you for completing the ${level} level interview! `;
  
  if (completionRate >= 90) {
    message += `Excellent work answering ${answered} out of ${total} questions. `;
  } else if (completionRate >= 70) {
    message += `Good job answering ${answered} out of ${total} questions. `;
  } else {
    message += `You answered ${answered} out of ${total} questions. `;
  }
  
  message += "Your responses are being evaluated and results will be available shortly. Happy coding! 🚀";
  
  return message;
}

// ==================== ENHANCED TESTING FUNCTION ====================

// Updated main function for testing with DB integration
// async function testInterviewWithDB(sessionId) {
//   console.log("🎤 Welcome to AI Interview Bot (DB Mode)");
//   console.log("----------------------------------------");

//   // Initialize from database
//   const initResult = await initializeInterviewFromDB(sessionId);
  
//   if (!initResult.success) {
//     console.error("❌ Failed to initialize interview:", initResult.error);
//     return;
//   }

//   let session = initResult.workflowSession;
//   const { levelConfig } = initResult;
  
//   console.log(`📋 Interview Details:`);
//   console.log(`   Topic: ${session.interviewGoals.primaryTopic}`);
//   console.log(`   Level: ${session.interviewGoals.targetLevel}`);
//   console.log(`   Max Questions: ${levelConfig.maxQuestions}`);
//   console.log(`   Interview Type: ${session.interviewGoals.interviewFor}`);

//   let lastQuestionId = null;

//   const readline = await import('readline');
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   async function askQuestion(questionObj) {
//     return new Promise((resolve) => {
//       rl.question(`\n❓ ${questionObj.question}\n\n💬 Your answer: `, (answer) => {
//         resolve(answer);
//       });
//     });
//   }

//   // Interview loop
//   while (true) {
//     const result = await processResponseAndGenerateNext(
//       session,
//       lastQuestionId,
//       lastQuestionId ? session.conversationHistory.slice(-1)[0].response : null
//     );

//     if (result.type === "complete") {
//       console.log("\n✅ Interview Finished!");
//       console.log(result.message);
//       console.log(`📊 Final Stats: ${session.sessionMetrics.questionsAnswered}/${session.sessionMetrics.questionsAsked} questions answered`);
//       break;
//     }

//     if (result.type === "error") {
//       console.error("❌ Error:", result.message);
//       break;
//     }

//     const nextQ = result.nextQuestion;
//     session = result.updatedSession;
//     lastQuestionId = nextQ.questionId;

//     // Ask question
//     const userAnswer = await askQuestion(nextQ);

//     // Save response to session
//     session = addResponseToSession(session, lastQuestionId, userAnswer);
//   }

//   rl.close();
// }

// ==================== EXPORTS ====================

export {
  // Enhanced Database Functions
  initializeInterviewFromDB,
  saveSessionToDB,
  
  // Original Functions (Enhanced)
  generateInterviewQuestion,
  createInterviewSession,
  addQuestionToSession,
  addResponseToSession,
  processResponseAndGenerateNext,
  
  // Utilities
  generateSessionId,
  normalizeLevel,
  LEVEL_CONFIG,
  
  // Testing
  testInterviewWithDB
};
