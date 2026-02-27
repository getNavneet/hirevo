import {
  initializeInterviewFromDB,
  processResponseAndGenerateNext,
} from "./index.dbintegration.js";

/**
 * LangGraph-ready runtime adapter.
 *
 * Why this exists:
 * - npm installation for @langchain/langgraph may be blocked in restricted environments.
 * - this module centralizes the interview workflow as graph-like nodes so we can swap to
 *   an actual LangGraph StateGraph implementation with minimal socket/controller changes.
 */

async function nodeInitializeSession(sessionId) {
  const initResult = await initializeInterviewFromDB(sessionId);

  if (!initResult?.success || !initResult.workflowSession) {
    return {
      ok: false,
      error: "Invalid sessionId",
    };
  }

  return {
    ok: true,
    workflowSession: initResult.workflowSession,
  };
}

async function nodeGenerateNextQuestion(workflowSession, lastQuestionId, responseText) {
  const result = await processResponseAndGenerateNext(
    workflowSession,
    lastQuestionId,
    responseText
  );

  if (result.type === "continue") {
    return {
      ok: true,
      status: "continue",
      updatedSession: result.updatedSession,
      nextQuestion: result.nextQuestion,
    };
  }

  if (result.type === "complete") {
    return {
      ok: true,
      status: "complete",
      updatedSession: result.updatedSession,
      message: result.message,
    };
  }

  return {
    ok: false,
    error: result?.message || "Workflow error processing response.",
  };
}

export async function runInterviewStartGraph(sessionId) {
  const initNodeOutput = await nodeInitializeSession(sessionId);
  if (!initNodeOutput.ok) return initNodeOutput;

  return nodeGenerateNextQuestion(initNodeOutput.workflowSession, null, null);
}

export async function runInterviewTurnGraph(workflowSession, finalText) {
  const lastQuestionId = workflowSession?.conversationHistory?.slice(-1)[0]?.questionId;

  if (!workflowSession || !lastQuestionId) {
    return {
      ok: false,
      error: "No active session or last question ID.",
    };
  }

  return nodeGenerateNextQuestion(workflowSession, lastQuestionId, finalText);
}
