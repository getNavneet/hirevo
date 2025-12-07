import {
  initializeInterviewFromDB,
  processResponseAndGenerateNext,
} from "../src/services/questionGeneration/index.dbintegration.js";

async function testQuestionGeneration(sessionId) {
  try {
    // Step 1: Initialize interview session
    const initResult = await initializeInterviewFromDB(sessionId);

    if (!initResult.success) {
      console.error("❌ Failed to initialize session. Check sessionId.");
      return;
    }

    let workflowSession = initResult.workflowSession;

    console.log("✅ Session initialized.");

    // Step 2: Get first question
    let result = await processResponseAndGenerateNext(workflowSession, null, null);

    if (result.type !== "continue") {
      console.error("❌ Failed to get first question:", result.message);
      return;
    }

    console.log("\n🧠 First Question:", result.nextQuestion.question);
    workflowSession = result.updatedSession;

    // Simulate a few responses
    const userResponses = [
      "I am experienced in project management.",
      "I handled conflicts by open communication.",
      "I use Agile methodologies.",
    ];

    for (const response of userResponses) {
      console.log(`\n👤 User response: "${response}"`);

      result = await processResponseAndGenerateNext(
        workflowSession,
        result.nextQuestion.questionId,
        response
      );

      if (result.type === "continue") {
        console.log("🤖 Next Question:", result.nextQuestion.question);
        workflowSession = result.updatedSession;
      } else if (result.type === "complete") {
        console.log("✅ Interview complete:", result.message);
        break;
      } else {
        console.error("⚠️ Workflow error:", result.message);
        break;
      }
    }
  } catch (err) {
    console.error("💥 Unexpected error:", err);
  }
}

// Replace this with a real sessionId from your DB
const SESSION_ID = "a76f1f7400cccc0a14cf386266370c83";

testQuestionGeneration(SESSION_ID);
