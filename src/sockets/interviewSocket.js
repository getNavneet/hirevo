//similar to transcription.claude.js
import { createSpeechStream } from "../services/sst/speechHandlerGoogle.js";
import { 
  initializeInterviewFromDB, 
  processResponseAndGenerateNext,
  addResponseToSession,
} from "../services/questionGeneration/index.dbintegration.js";


async function processTranscript(socket, finalText) {
  // Get the last question ID from the current session history
  const lastQuestionId = socket.workflowSession?.conversationHistory?.slice(-1)[0]?.questionId;
  
  if (!socket.workflowSession || !lastQuestionId) {
    console.warn(`[${socket.id}] Skipping transcript processing: no active session or last question ID.`);
    return;
  }

  try {
    // Process the user's response and get the next question
    const result = await processResponseAndGenerateNext(socket.workflowSession, lastQuestionId, finalText);
    
    if (result.type === "continue") {
      // Update the session state on the socket
      socket.workflowSession = result.updatedSession;
      // Emit the new question to the client
      socket.emit("nextQuestion", { question: result.nextQuestion.question });
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

    let speechStream = null;

    // 🔹 Client sends sessionId to join interview
    socket.on("joinInterview", async ({ sessionId }) => {
      try {
        console.log(`[${socket.id}] 🤝 Attempting to join interview: ${sessionId}`);
        
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
        // We call processResponseAndGenerateNext with no response to get the first question
        const result = await processResponseAndGenerateNext(socket.workflowSession, null, null);
        
        if (result.type === "continue") {
          // Update the session state on the socket and send the question to the client
          socket.workflowSession = result.updatedSession;
          socket.emit("interviewReady", {
            sessionId,
            question: result.nextQuestion.question,
          });
        } else {
          // Handle potential errors from the workflow
          console.error(`[${socket.id}] Error generating first question:`, result.message);
          socket.emit("error", { message: "Failed to start interview. Please try again." });
        }

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
          //speechStream is a varaible and createSpeechStream is a high order function that takes function as a argument
          // Real-time partial transcripts
          onPartialTranscript: (partialText) => {
            // console.log(`[${socket.id}] 📝 Partial transcript: ${partialText}`);
            socket.emit("partial-transcription", { text: partialText });
          },
          
          // Individual final transcripts (per speech segment)
          onFinalTranscript: async (finalText) => {
            //here is the flaw/erroe in code When the stream detects a pause, it triggers the onFinalTranscript function. This is the most crucial part of our code workflow, as it is the moment when a user's complete answer is captured and passed to the rest of your AI logic. The processTranscript function then takes this complete thought and uses it to decide what to do next - but i dont want this because when user is taking a little pause the answer is getting generated but actually user has not finished his response its just a little pause now tell me how to handle this
            console.log(`[${socket.id}] 📝 Final segment: ${finalText}`);
            socket.emit("transcription", { text: finalText });
            
            // Call the dedicated processing function
            await processTranscript(socket, finalText);
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

    // 🔹 Cleanup on disconnect
    socket.on("disconnect", () => {
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
