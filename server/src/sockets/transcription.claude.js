import InterviewSession from "../models/interviewsession.model.js";
import { createSpeechStream } from "../services/sst/speechHandlerGoogle.js";

// Separate function for processing transcripts
async function processTranscript(transcript, sessionData) {
  // Your LLM processing logic here
  console.log('Processing transcript:', transcript);
  console.log('Session data:', sessionData);
  

  
  // Example: Send to your LLM service
  // const response = await llmService.process(transcript, sessionData);
  // return response;
  
  return { processed: true, transcript };
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

    let speechStream = null;

    // 🔹 Client sends sessionId to join interview
    socket.on("joinInterview", async ({ sessionId }) => {
      try {
        const session = await InterviewSession.findOne({ sessionId });

        if (!session) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        socket.session = session;
        console.log(`[${socket.id}] joined interview: ${sessionId}`);

        socket.emit("interviewReady", {
          sessionId,
          category: session.category,
          subcategory: session.subcategory,
          level: session.level,
          resumeAvailable: !!session.resume,
        });

      } catch (err) {
        console.error("Error joining interview:", err);
        socket.emit("error", { message: "Server error while joining" });
      }
    });

    // 🔹 Start speech recognition with callbacks
    socket.on("startSpeechRecognition", () => {
      try {
        console.log(`[${socket.id}] 🎙️ Starting speech recognition`);
        
        // Create speech stream with callback functions
        speechStream = createSpeechStream({
          // Real-time partial transcripts
          onPartialTranscript: (partialText) => {
            console.log(`[${socket.id}] 📝 Partial transcript: ${partialText}`);
            socket.emit("partial-transcription", { text: partialText });
          },
          
          // Individual final transcripts (per speech segment)
          onFinalTranscript: async (finalText) => {
            console.log(`[${socket.id}] 📝 Final segment: ${finalText}`);
            socket.emit("transcription", { text: finalText });
            
            // Optional: Process each segment immediately
            if (socket.session) {
              try {
                const result = await processTranscript(finalText, socket.session);
                socket.emit("transcriptProcessed", result);
              } catch (err) {
                console.error(`[${socket.id}] Error processing transcript:`, err);
              }
            }
          },
          
          // Error handling
          onError: (error, message) => {
            console.error(`[${socket.id}] Speech error:`, error);
            socket.emit("transcription-error", message);
          },
          
          // Stream lifecycle
          onStreamStart: () => {
            socket.emit("speechRecognitionStarted");
          },
          
          // Complete session transcript
          onStreamEnd: async (completeTranscript) => {
            console.log(`[${socket.id}] 📄 Complete transcript: ${completeTranscript}`);
            socket.emit("transcriptionComplete", { text: completeTranscript });
            
            // Process complete transcript
            if (socket.session && completeTranscript) {
              try {
                const result = await processTranscript(completeTranscript, socket.session);
                socket.emit("finalTranscriptProcessed", result);
              } catch (err) {
                console.error(`[${socket.id}] Error processing final transcript:`, err);
              }
            }
          }
        });

        // Start the stream
        const started = speechStream.startStream();
        if (!started) {
          socket.emit("transcription-error", "Failed to start speech recognition");
        }

      } catch (err) {
        console.error(`[${socket.id}] Error starting speech recognition:`, err);
        socket.emit("transcription-error", "Failed to start speech recognition");
      }
    });

    // 🔹 Receive audio chunks
    socket.on("audioChunk", (audioData) => {
      if (speechStream && speechStream.isActive()) {
        const chunk = Buffer.from(audioData);
        speechStream.writeAudio(chunk);
      } else {
        console.warn(`[${socket.id}] Received audio chunk but no active stream`);
      }
    });

    // 🔹 Stop speech recognition
    socket.on("stopSpeechRecognition", () => {
      console.log(`[${socket.id}] 🛑 Stopping speech recognition`);
      
      if (speechStream) {
        speechStream.endStream();
        speechStream = null;
      }
      
      socket.emit("speechRecognitionStopped");
    });

    // 🔹 Get current transcript (optional)
    socket.on("getCurrentTranscript", () => {
      if (speechStream) {
        const currentTranscript = speechStream.getAccumulatedTranscript();
        socket.emit("currentTranscript", { text: currentTranscript });
      }
    });

    // 🔹 Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);
      
      if (speechStream) {
        speechStream.endStream();
        speechStream = null;
      }
    });
  });
}