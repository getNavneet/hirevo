import { getIo } from "./socket.js"; 
import InterviewSession from "./models/interviewsession.model.js";

export function initSocket() {
    const io = getIo(); 
  io.on("connection", (socket) => {
    console.log(`[${socket.id}] connected to server`);
     socket.data.pendingAudio = [];

    // 🔹 Client sends sessionId to join interview
    socket.on("joinInterview", async ({ sessionId }) => { 
      try {
        const session = await InterviewSession.findOne({ sessionId });

        if (!session) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        // Attach session to socket, each client-new socket obj , stored in ram
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

  // ✅ Receive audio chunks
    socket.on("audioChunk", (chunk) => {
      socket.data.pendingAudio.push(Buffer.from(chunk));
    });

    // ✅ End of user's answer
    socket.on("endAnswer", async ({ sessionId, lastQuestionId }) => {
      const audioBuffer = Buffer.concat(socket.data.pendingAudio || []);
      socket.data.pendingAudio = [];

      try {
        // 🔹 Transcribe audio
        const transcription = await openai.audio.transcriptions.create({
          file: new File([audioBuffer], "speech.wav", { type: "audio/wav" }),
          model: "gpt-4o-mini-transcribe",
        });

        const userAnswer = transcription.text;
        console.log("📝 Transcript:", userAnswer);

        // 🔹 Load session from DB
        let session = await InterviewSession.findOne({ sessionId });
        if (!session) {
          socket.emit("error", { message: "Invalid session ID" });
          return;
        }

        // 🔹 Update conversation history with user's answer
        const updatedHistory = session.conversationHistory.map((q) =>
          q.questionId === lastQuestionId ? { ...q, response: userAnswer } : q
        );
        session.conversationHistory = updatedHistory;

        // 🔹 Process and get next question
        const result = await processResponseAndGenerateNext(
          session.toObject(), // if you need a plain JS object
          lastQuestionId,
          userAnswer
        );

        if (result.type === "complete") {
          socket.emit("interviewComplete", { message: result.message });
          return;
        }

        const nextQ = result.nextQuestion;

        // 🔹 Add next question to session
        session.conversationHistory.push(nextQ);
        await session.save();

        // 🔹 Convert to audio
        const tts = await openai.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: nextQ.question,
        });

        // 🔹 Send next question back to client
        socket.emit("question", {
          text: nextQ.question,
          questionId: nextQ.questionId,
          audio: Buffer.from(await tts.arrayBuffer()),
        });
      } catch (err) {
        console.error("❌ Error handling audio:", err);
        socket.emit("error", { message: "Error processing answer" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);
    });
  });
}
