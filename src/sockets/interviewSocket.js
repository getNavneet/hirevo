import { createInterviewSession, processResponseAndGenerateNext } from "../services/questionGeneration/index.js";
import { getIo } from "./socket.js"; 
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let sessions = {}; // temporary in-memory store

export function setupInterviewSocket() {
  const io = getIo(); 
  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    // ---- Start Interview ----
    socket.on("startInterview", (payload, callback) => {
      const { category, subcategory, level } = payload;

      let session = createInterviewSession({
        primaryTopic: subcategory,
        targetLevel: level,
        interviewFor: category,
        maxQuestions: 5,
      });

      sessions[socket.id] = {
        session,
        lastQuestionId: null,
        pendingAudio: [],
      };

      console.log("🎯 Interview session created for:", socket.id);

      callback({ success: true, message: "Interview started" });

      // Ask first question
      processNext(socket.id, io);
    });

    // ---- Collect audio chunks ----
    socket.on("audioChunk", async (chunk) => {
      const data = sessions[socket.id];
      if (!data) return;
      data.pendingAudio.push(Buffer.from(chunk));
    });

    // ---- Finish user answer ----
    socket.on("endAnswer", async () => {
      const data = sessions[socket.id];
      if (!data) return;

      const audioBuffer = Buffer.concat(data.pendingAudio);
      data.pendingAudio = [];

      try {
        const transcription = await openai.audio.transcriptions.create({
          file: new File([audioBuffer], "speech.wav", { type: "audio/wav" }),
          model: "gpt-4o-mini-transcribe",
        });

        const userAnswer = transcription.text;
        console.log("📝 Transcript:", userAnswer);

        let { session, lastQuestionId } = data;

        session = {
          ...session,
          conversationHistory: session.conversationHistory.map((q) =>
            q.questionId === lastQuestionId ? { ...q, response: userAnswer } : q
          ),
        };

        sessions[socket.id].session = session;

        const result = await processResponseAndGenerateNext(
          session,
          lastQuestionId,
          userAnswer
        );

        if (result.type === "complete") {
          io.to(socket.id).emit("interviewComplete", { message: result.message });
          delete sessions[socket.id];
          return;
        }

        const nextQ = result.nextQuestion;
        sessions[socket.id] = {
          session: result.updatedSession,
          lastQuestionId: nextQ.questionId,
          pendingAudio: [],
        };

        const tts = await openai.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: nextQ.question,
        });

        io.to(socket.id).emit("question", {
          text: nextQ.question,
          audio: Buffer.from(await tts.arrayBuffer()),
        });
      } catch (err) {
        console.error("❌ Error handling audio:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      delete sessions[socket.id];
    });
  });
}
