//this file code allings with the condition that transcription will happen at frontend level and directly transcription will be provided with will be passed to LLM for transcription

import {
  initializeInterviewFromDB,
  processResponseAndGenerateNext,
  addResponseToSession,
} from "../services/questionGeneration/index.dbintegration.js";
import { synthesizeSpeech } from "../services/tts/ttsHandlerGoogle.js";

async function processTranscript(socket, finalText) {
  // Get the last question ID from the current session history
  const lastQuestionId =
    socket.workflowSession?.conversationHistory?.slice(-1)[0]?.questionId;

  if (!socket.workflowSession || !lastQuestionId) {
    console.warn(
      `[${socket.id}] Skipping transcript processing: no active session or last question ID.`
    );
    return;
  }

  try {
    // Process the user's response and get the next question
    const result = await processResponseAndGenerateNext(
      socket.workflowSession,
      lastQuestionId,
      finalText
    );

    if (result.type === "continue") {
      // Update the session state on the socket
      socket.workflowSession = result.updatedSession;

      const audioBuffer = await synthesizeSpeech(result.nextQuestion.question);

      // Emit the new question to the client
      socket.emit("nextQuestion", {
        question: result.nextQuestion.question,
        audioData: audioBuffer.toString("base64"), // Convert Buffer to Base64 for transmission
      });
    } else if (result.type === "complete") {
      // The interview is over, send the completion message
      socket.workflowSession = result.updatedSession;
      socket.emit("interviewComplete", { message: result.message });
    } else {
      // Handle workflow error
      console.error(`[${socket.id}] Workflow error:`, result.message);
      socket.emit("error", { message: "Workflow error processing response." });
    }
  } catch (err) {
    console.error(`[${socket.id}] Error processing transcript:`, err);
    socket.emit("error", { message: "Server error processing response." });
  }
}

export async function InterviewSocket(server) {
  const { Server } = await import("socket.io"); // dynamic import since top-level used elsewhere
  const io = new Server(server, {
    cors: {
      origin: "*", // frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[${socket.id}] connected to server`);

    // 🔹 Client sends sessionId to join interview
    socket.on("joinInterview", async ({ sessionId }) => {
      try {
        console.log(
          `[${socket.id}] 🤝 Attempting to join interview: ${sessionId}`
        );

        // Use the workflow function to initialize the full session context
        const initResult = await initializeInterviewFromDB(sessionId);

        if (!initResult.success) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        // Store the full workflow session on the socket object
        socket.workflowSession = initResult.workflowSession;
        console.log(`[${socket.id}] Joined interview: ${sessionId}`);

        // Now, generate the first question immediately after joining
        const result = await processResponseAndGenerateNext(
          socket.workflowSession,
          null,
          null
        );

        if (result.type === "continue") {
          // Update the session state on the socket and send the question to the client
          socket.workflowSession = result.updatedSession;

          const audioBuffer = await synthesizeSpeech(
            result.nextQuestion.question
          );

          socket.emit("interviewReady", {
            sessionId,
            question: result.nextQuestion.question,
            audioData: audioBuffer.toString("base64"), // Convert Buffer to Base64
          });
        } else {
          // Handle potential errors from the workflow
          console.error(
            `[${socket.id}] Error generating first question:`,
            result.message
          );
          socket.emit("error", {
            message: "Failed to start interview. Please try again.",
          });
        }
      } catch (err) {
        console.error("Error joining interview:", err);
        socket.emit("error", { message: "Server error while joining" });
      }
    });

    // 🔹 Receive the final, complete response from the client
    socket.on("completeResponse", async (data) => {
      await processTranscript(socket, data.finalText);
    });

    // 🔹 Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);
      // Clean up the session context from the socket
      if (socket.workflowSession) {
        socket.workflowSession = null;
      }
    });
  });
}