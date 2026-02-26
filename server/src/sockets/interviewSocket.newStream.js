import {
  initializeInterviewFromDB,
  processResponseAndGenerateNext,
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
      socket.workflowSession = result.updatedSession;

      const audioBuffer = await synthesizeSpeech(
        result.nextQuestion.question
      );

      // Emit the new question to the client
      socket.emit("nextQuestion", {
        question: result.nextQuestion.question,
        audioData: audioBuffer.toString("base64"),
      });
    } else if (result.type === "complete") {
      socket.workflowSession = result.updatedSession;
      socket.emit("interviewComplete", { message: result.message });
    } else {
      console.error(`[${socket.id}] Workflow error:`, result.message);
      socket.emit("error", {
        message: "Workflow error processing response.",
      });
    }
  } catch (err) {
    console.error(`[${socket.id}] Error processing transcript:`, err);
    socket.emit("error", {
      message: "Server error processing response.",
    });
  }
}

export async function InterviewSocket(server) {
  const { Server } = await import("socket.io");

  const allowedOrigin = process.env.CORS_ORIGIN || "*";

  const io = new Server(server, {
    cors: {
      origin: allowedOrigin,
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

        const initResult = await initializeInterviewFromDB(sessionId);

        if (!initResult.success) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        socket.workflowSession = initResult.workflowSession;
        console.log(`[${socket.id}] Joined interview: ${sessionId}`);

        // Generate the first question
        const result = await processResponseAndGenerateNext(
          socket.workflowSession,
          null,
          null
        );

        if (result.type === "continue") {
          socket.workflowSession = result.updatedSession;

          const audioBuffer = await synthesizeSpeech(
            result.nextQuestion.question
          );

          socket.emit("interviewReady", {
            sessionId,
            question: result.nextQuestion.question,
            audioData: audioBuffer.toString("base64"),
          });
        } else {
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
        socket.emit("error", {
          message: "Server error while joining",
        });
      }
    });

    // 🔹 Receive the final, complete response from the client
    socket.on("completeResponse", async (data) => {
      console.log(`[${socket.id}] 👆 User sent complete response`);
      await processTranscript(socket, data.finalText);
    });

    // 🔹 Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);

      if (socket.workflowSession) {
        socket.workflowSession = null;
      }
    });
  });
}