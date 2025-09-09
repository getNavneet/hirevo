import { createSpeechStream } from "../services/sst/speechHandlerGoogle.js";
import {
  initializeInterviewFromDB,
  processResponseAndGenerateNext,
} from "../services/questionGeneration/index.dbintegration.js";
import { synthesizeSpeech } from "../services/tts/ttsHandlerGoogle.js";

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
    socket.interviewState = 'processing';
    socket.emit("stateChange", { state: "processing" });

    const result = await processResponseAndGenerateNext(
      socket.workflowSession,
      lastQuestionId,
      finalText
    );

    if (result.type === "continue") {
      socket.workflowSession = result.updatedSession;
      socket.interviewState = 'ai_speaking';
      socket.emit("stateChange", { state: "ai_speaking" });

      const audioBuffer = await synthesizeSpeech(result.nextQuestion.question);

      socket.emit("nextQuestion", {
        question: result.nextQuestion.question,
        audioData: audioBuffer.toString("base64"),
      });
    } else if (result.type === "complete") {
      socket.workflowSession = result.updatedSession;
      socket.interviewState = 'completed';
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

    // Speech stream state
    let speechStream = null;
    let isStreamInitialized = false;
    let isRecording = false; // Controls whether to send audio to stream

    // Interview state
    socket.interviewState = 'idle';
    socket.accumulatedTranscript = '';

    // Initialize persistent speech stream once per interview session
    const initializePersistentSpeechStream = () => {
      if (isStreamInitialized) {
        console.log(`[${socket.id}] Speech stream already initialized`);
        return true;
      }

      console.log(`[${socket.id}] Initializing persistent speech stream`);

      try {
        speechStream = createSpeechStream({
          // Real-time partial transcripts - only process when recording
          onPartialTranscript: (partialText) => {
            if (isRecording && socket.interviewState === 'user_speaking') {
              socket.emit("partial-transcription", { text: partialText });
            }
          },

          // Final transcripts - only process when recording
          onFinalTranscript: (finalText) => {
            if (isRecording && socket.interviewState === 'user_speaking') {
              console.log(`[${socket.id}] Final segment received: ${finalText}`);
              // Accumulate transcript segments
              socket.accumulatedTranscript += (socket.accumulatedTranscript ? ' ' : '') + finalText;
              socket.emit("transcription", { 
                text: finalText,
                accumulated: socket.accumulatedTranscript 
              });
            }
          },

          // Error handling
          onError: (error, message) => {
            console.error(`[${socket.id}] Speech stream error:`, error);
            socket.emit("transcription-error", message);
            // Don't change interview state, just log the error
          },

          // Stream lifecycle
          onStreamStart: () => {
            console.log(`[${socket.id}] Persistent speech stream started`);
            socket.emit("speechStreamReady");
          },

          // Stream end (should rarely happen in persistent mode)
          onStreamEnd: (completeTranscript) => {
            console.log(`[${socket.id}] Speech stream ended unexpectedly: ${completeTranscript}`);
            socket.emit("speechStreamEnded", { text: completeTranscript });
            isStreamInitialized = false;
          },
        });

        // Start the persistent stream
        const started = speechStream.startStream();
        if (started) {
          isStreamInitialized = true;
          console.log(`[${socket.id}] Persistent speech stream successfully initialized`);
          return true;
        } else {
          console.error(`[${socket.id}] Failed to initialize persistent speech stream`);
          return false;
        }
      } catch (err) {
        console.error(`[${socket.id}] Error initializing speech stream:`, err);
        return false;
      }
    };

    // Cleanup speech stream
    const cleanupSpeechStream = () => {
      if (speechStream) {
        console.log(`[${socket.id}] Cleaning up persistent speech stream`);
        speechStream.endStream();
        speechStream = null;
        isStreamInitialized = false;
        isRecording = false;
      }
    };

    // Join interview and establish persistent speech stream
    socket.on("joinInterview", async ({ sessionId }) => {
      try {
        console.log(`[${socket.id}] Attempting to join interview: ${sessionId}`);

        const initResult = await initializeInterviewFromDB(sessionId);

        if (!initResult.success) {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }

        // Set up interview session
        socket.workflowSession = initResult.workflowSession;
        socket.interviewState = 'ai_speaking';
        socket.accumulatedTranscript = '';
        isRecording = false;

        console.log(`[${socket.id}] Joined interview: ${sessionId}`);

        // Initialize persistent speech stream immediately
        const streamInitialized = initializePersistentSpeechStream();
        if (!streamInitialized) {
          socket.emit("error", { message: "Failed to initialize speech recognition" });
          return;
        }

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
            state: "ai_speaking"
          });
        } else {
          console.error(`[${socket.id}] Error generating first question:`, result.message);
          socket.emit("error", {
            message: "Failed to start interview. Please try again.",
          });
        }
      } catch (err) {
        console.error(`[${socket.id}] Error joining interview:`, err);
        socket.emit("error", { message: "Server error while joining" });
      }
    });

    // Audio playback finished - user can now speak
    socket.on("audioPlaybackFinished", () => {
      console.log(`[${socket.id}] Audio playback finished`);
      socket.interviewState = 'waiting_for_user';
      socket.emit("stateChange", { state: "waiting_for_user" });
    });

    // Start recording - just enable audio flow to persistent stream
    socket.on("startRecording", () => {
      try {
        console.log(`[${socket.id}] Start recording request`);

        // Check if persistent stream is ready
        if (!isStreamInitialized || !speechStream || !speechStream.isActive()) {
          console.log(`[${socket.id}] Speech stream not ready`);
          socket.emit("recordingBlocked", { 
            reason: "Speech recognition stream not ready",
            streamInitialized: isStreamInitialized,
            streamActive: speechStream?.isActive() || false
          });
          return;
        }

        // Check interview state
        if (socket.interviewState !== 'waiting_for_user') {
          console.log(`[${socket.id}] Cannot start recording in state: ${socket.interviewState}`);
          socket.emit("recordingBlocked", { 
            reason: `Cannot record in state: ${socket.interviewState}`,
            currentState: socket.interviewState
          });
          return;
        }

        // Enable recording (audio will now be processed by stream)
        socket.interviewState = 'user_speaking';
        socket.accumulatedTranscript = '';
        isRecording = true;

        socket.emit("recordingStarted");
        console.log(`[${socket.id}] Recording started - audio flow enabled`);

      } catch (err) {
        console.error(`[${socket.id}] Error starting recording:`, err);
        socket.emit("recordingBlocked", { reason: "Failed to start recording" });
      }
    });

    // Stop recording - just disable audio flow, keep stream alive
    socket.on("stopRecording", () => {
      console.log(`[${socket.id}] Stop recording request`);
      
      if (isRecording) {
        isRecording = false;
        socket.interviewState = 'waiting_for_user';
        socket.emit("recordingStopped");
        console.log(`[${socket.id}] Recording stopped - audio flow disabled`);
      } else {
        console.log(`[${socket.id}] Stop recording called but not recording`);
      }
    });

    // Audio chunks - only send to stream when recording
    socket.on("audioChunk", (audioData) => {
      if (speechStream && 
          speechStream.isActive() && 
          isRecording && 
          socket.interviewState === 'user_speaking') {
        
        const chunk = Buffer.from(audioData);
        speechStream.writeAudio(chunk);
      } else {
        // Silently ignore chunks when not recording (don't spam logs)
        if (!isRecording) {
          console.debug(`[${socket.id}] Ignored audio chunk - not recording`);
        }
      }
    });

    // Process complete user response
    socket.on("completeResponse", async (data) => {
      console.log(`[${socket.id}] User sent complete response`);
      const finalText = socket.accumulatedTranscript || data.finalText;
      
      // Stop recording when processing response
      isRecording = false;
      
      await processTranscript(socket, finalText);
    });

    // Get current accumulated transcript
    socket.on("getAccumulatedTranscript", () => {
      socket.emit("accumulatedTranscript", { 
        text: socket.accumulatedTranscript 
      });
    });

    // Force cleanup speech stream (emergency stop)
    socket.on("stopSpeechRecognition", () => {
      console.log(`[${socket.id}] Force stopping speech recognition`);
      cleanupSpeechStream();
      socket.interviewState = 'waiting_for_user';
      socket.emit("speechRecognitionStopped");
    });

    // Pause/resume interview (optional)
    socket.on("pauseInterview", () => {
      console.log(`[${socket.id}] Interview paused`);
      isRecording = false; // Stop processing audio
      socket.interviewState = 'paused';
      socket.emit("stateChange", { state: "paused" });
    });

    socket.on("resumeInterview", () => {
      console.log(`[${socket.id}] Interview resumed`);
      socket.interviewState = 'waiting_for_user';
      socket.emit("stateChange", { state: "waiting_for_user" });
    });

    // Debug endpoints
    socket.on("getDebugInfo", () => {
      socket.emit("debugInfo", {
        interviewState: socket.interviewState,
        isStreamInitialized,
        isRecording,
        streamActive: speechStream?.isActive() || false,
        accumulatedTranscript: socket.accumulatedTranscript,
        sessionId: socket.workflowSession?.sessionId || null
      });
    });

    // Handle disconnect and cleanup
    socket.on("disconnect", () => {
      console.log(`[${socket.id}] disconnected`);

      // Cleanup everything
      cleanupSpeechStream();
      
      if (socket.workflowSession) {
        socket.workflowSession = null;
      }
      
      socket.interviewState = 'idle';
      socket.accumulatedTranscript = '';
      isRecording = false;
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`[${socket.id}] Socket error:`, error);
      socket.emit("error", { message: "Connection error occurred" });
    });
  });

  // Handle server-level events
  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });


}
