// interviewSocket.js - Using function-based transcription
import {
  initializeInterviewFromDB,
  processResponseAndGenerateNext,
} from "../services/questionGeneration/index.dbintegration.js";
import { synthesizeSpeech } from "../services/tts/ttsHandlerGoogle.js";
import { 
  initializeTranscription, 
  destroyTranscription,
  getTranscriptionStatus 
} from "./transcriptionHandler.socket.js";

async function processTranscript(socket, finalText) {
  const lastQuestionId =
    socket.workflowSession?.conversationHistory?.slice(-1)[0]?.questionId;

  if (!socket.workflowSession || !lastQuestionId) {
    console.warn(
      `[${socket.id}] Skipping transcript processing: no active session or last question ID.`
    );
    return;
  }

  try {
    const result = await processResponseAndGenerateNext(
      socket.workflowSession,
      lastQuestionId,
      finalText
    );

    if (result.type === "continue") {
      socket.workflowSession = result.updatedSession;
      const audioBuffer = await synthesizeSpeech(result.nextQuestion.question);

      socket.emit("nextQuestion", {
        question: result.nextQuestion.question,
        audioData: audioBuffer.toString("base64"),
      });
    } else if (result.type === "complete") {
      socket.workflowSession = result.updatedSession;
      socket.emit("interviewComplete", { message: result.message });
    } else {
      console.error(`[${socket.id}] Workflow error:`, result.message);
      socket.emit("error", { message: "Workflow error processing response." });
    }
  } catch (err) {
    console.error(`[${socket.id}] Error processing transcript:`, err);
    socket.emit("error", { message: "Server error processing response." });
  }
}

export async function InterviewSocket(server) {
  const { Server } = await import("socket.io");
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[${socket.id}] connected to server`);

    // Initialize transcription handler for this socket
    initializeTranscription(socket);

    // Interview-specific events
    socket.on("joinInterview", async ({ sessionId }) => {
      try {
        console.log(`[${socket.id}] 🤝 Attempting to join interview: ${sessionId}`);

        const initResult = await initializeInterviewFromDB(sessionId);

        if (!initResult.success) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        socket.workflowSession = initResult.workflowSession;
        console.log(`[${socket.id}] Joined interview: ${sessionId}`);

        // Generate first question
        const result = await processResponseAndGenerateNext(
          socket.workflowSession,
          null,
          null
        );

        if (result.type === "continue") {
          socket.workflowSession = result.updatedSession;
          
          const audioBuffer = await synthesizeSpeech(result.nextQuestion.question);

          socket.emit("interviewReady", {
            sessionId,
            question: result.nextQuestion.question,
            audioData: audioBuffer.toString("base64"),
          });
        } else {
          console.error(`[${socket.id}] Error generating first question:`, result.message);
          socket.emit("error", {
            message: "Failed to start interview. Please try again.",
          });
        }
      } catch (err) {
        console.error("Error joining interview:", err);
        socket.emit("error", { message: "Server error while joining" });
      }
    });

    // Process complete user response
    socket.on("completeResponse", async (data) => {
      console.log(`[${socket.id}] 👆 User sent complete response`);
      await processTranscript(socket, data.finalText);
    });

    // Debug endpoint to check transcription status
    socket.on("checkTranscriptionStatus", () => {
      const status = getTranscriptionStatus(socket.id);
      socket.emit("transcriptionStatus", status);
      console.log(`[${socket.id}] 🔍 Transcription status:`, status);
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);
      
      // Clean up transcription
      destroyTranscription(socket);
      
      // Clean up session
      if (socket.workflowSession) {
        socket.workflowSession = null;
      }
    });
  });

  // Optional: Add server-level health check endpoint
  setInterval(() => {
    const activeCount = io.sockets.sockets.size;
    if (activeCount > 0) {
      console.log(`📊 Active connections: ${activeCount}`);
    }
  }, 30000); // Every 30 seconds
}