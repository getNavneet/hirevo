
import { createSpeechStream } from "./speechHandler.google.js";

export async function sttSocket(server) {
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
    console.log(`[${socket.id}] connected to stt server`);

    let speechStream = null;

    // 🔹 Start speech recognition with callbacks
    socket.on("startSpeechRecognition", () => {
      if (socket.recognitionActive) {
        console.warn(
          `[${socket.id}] Recognition already active, ignoring start`
        );
        return;
      }

      socket.recognitionActive = true;
      try {
        console.log(`[${socket.id}] 🎙️ Starting speech recognition`);

        // Clean up previous stream if it exists
        if (speechStream) {
          speechStream.endStream();
          speechStream = null;
        }

        // Create a new stream, calling function that returns startStream, stopStream, isActive
        speechStream = createSpeechStream({
          onPartialTranscript: (partialText) => {
            socket.emit("partial-transcription", { text: partialText });
          },
          onFinalTranscript: async (finalText) => {
            socket.emit("transcription", { text: finalText });
          },
          onError: (error, message) => {
            console.error(`[${socket.id}] Speech error:`, error);
            socket.emit("transcription-error", message);
          },
          onStreamStart: () => {
            socket.emit("speechRecognitionStarted");
          },
          onStreamEnd: async (completeTranscript) => {
            socket.emit("transcriptionComplete", { text: completeTranscript });
          },
        });

        const started = speechStream.startStream();
        if (!started) {
          socket.emit(
            "transcription-error",
            "Failed to start speech recognition"
          );
        }
      } catch (err) {
        console.error(`[${socket.id}] Error starting speech recognition:`, err);
        socket.emit(
          "transcription-error",
          "Failed to start speech recognition"
        );
      }
    });

    // 🔹 Receive audio chunks
    socket.on("audioChunk", (audioData) => {
      if (speechStream && speechStream.isActive()) {
        const chunk = Buffer.from(audioData);
        speechStream.writeAudio(chunk);
      } else {
        console.warn(
          `[${socket.id}] Received audio chunk but no active stream`
        );
      }
    });

    // 🔹 Stop speech recognition
    socket.on("stopSpeechRecognition", () => {
      console.log(`[${socket.id}]  Stopping speech recognition`);

      if (speechStream) {
        speechStream.endStream();
        speechStream = null;
      }

      socket.emit("speechRecognitionStopped");
    });

    // 🔹 Cleanup on disconnect
    socket.on("disconnect", () => {
      socket.recognitionActive = false;

      console.log(`[${socket.id}] disconnected`);

      if (speechStream) {
        speechStream.endStream();
        speechStream = null;
      }

      // Clean up the session context from the socket
      if (socket.workflowSession) {
        socket.workflowSession = null;
      }
    });
  });
}
