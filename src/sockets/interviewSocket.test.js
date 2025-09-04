// socket.js
import { Server } from "socket.io";
import InterviewSession from "./models/interviewsession.model.js";

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // restrict later
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[${socket.id}] connected`);

    // 🔹 Client sends sessionId to join interview
    socket.on("joinInterview", async ({ sessionId }) => {
      try {
        const session = await InterviewSession.findOne({ sessionId });

        if (!session) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        // Attach session to socket
        socket.session = session;

        console.log(`[${socket.id}] joined interview: ${sessionId}`);

        // Send acknowledgment
        socket.emit("interviewReady", {
          sessionId,
          category: session.category,
          subcategory: session.subcategory,
          level: session.level,
          resumeAvailable: !!session.resume,
        });

        // 🔹 Immediately send first question (your LLM handler can be called here)
        // const firstQ = await generateFirstQuestion(session);
        // socket.emit("question", firstQ);

      } catch (err) {
        console.error("Error joining interview:", err);
        socket.emit("error", { message: "Server error while joining" });
      }
    });

    // 🔹 Receive user answers
    socket.on("answer", async (answer) => {
      if (!socket.session) {
        socket.emit("error", { message: "Session not initialized" });
        return;
      }

      console.log(`[${socket.id}] Answer received:`, answer);

      // Save answer into DB
      await InterviewSession.findOneAndUpdate(
        { sessionId: socket.session.sessionId },
        { $push: { conversationHistory: { question: socket.lastQuestion, answer } } }
      );

      // Generate next question
      // const nextQ = await generateNextQuestion(socket.session, answer);
      // socket.lastQuestion = nextQ;
      // socket.emit("question", nextQ);
    });

    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);
    });
  });
}
