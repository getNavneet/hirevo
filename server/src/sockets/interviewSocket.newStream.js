import {
  runInterviewStartGraph,
  runInterviewTurnGraph,
} from "../services/questionGeneration/interviewGraph.runtime.js";
// import { synthesizeSpeech } from "../services/tts/ttsHandlerOpenai.js";
import { synthesizeSpeech } from "../services/tts/ttsHandlerGoogle.js";

async function processTranscript(socket, finalText) {
  try {
    const result = await runInterviewTurnGraph(socket.workflowSession, finalText);

    if (!result.ok) {
      console.error(`[${socket.id}] Workflow error:`, result.error);
      socket.emit("error", { message: result.error });
      return;
    }

    if (result.status === "continue") {
      socket.workflowSession = result.updatedSession;
      const audioBuffer = await synthesizeSpeech(result.nextQuestion.question);

      socket.emit("nextQuestion", {
        question: result.nextQuestion.question,
        audioData: audioBuffer.toString("base64"),
      });
      return;
    }

    socket.workflowSession = result.updatedSession;
    socket.emit("interviewComplete", { message: result.message });
  } catch (err) {
    console.error(`[${socket.id}] Error processing transcript:`, err);
    socket.emit("error", { message: "Server error processing response." });
  }
}


export async function InterviewSocket(server) {
  const { Server } = await import("socket.io"); // dynamic import since top-level used elsewhere
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

        const result = await runInterviewStartGraph(sessionId);

        if (!result.ok) {
          socket.emit("error", { message: result.error || "Invalid sessionId" });
          return;
        }

        socket.workflowSession = result.updatedSession;
        console.log(`[${socket.id}] Joined interview: ${sessionId}`);

        if (result.status === "continue") {
          const audioBuffer = await synthesizeSpeech(result.nextQuestion.question);

          socket.emit("interviewReady", {
            sessionId,
            question: result.nextQuestion.question,
            audioData: audioBuffer.toString("base64"),
          });
        } else {
          socket.emit("interviewComplete", { message: result.message });
        }
      } catch (err) {
        console.error("Error joining interview:", err);
        socket.emit("error", { message: "Server error while joining" });
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

      // Clean up the session context from the socket
      if (socket.workflowSession) {
        socket.workflowSession = null;
      }
    });
  });
}