//
import { createSpeechStream } from "../services/sst/speechHandlerGoogle.js";

// Store active transcription sessions
const activeSessions = new Map();

// Debug utilities
function debugAudioChunk(chunk, socketId) {
  if (!chunk) {
    console.error(`[${socketId}] ❌ Null audio chunk received`);
    return false;
  }
  
  if (chunk.length === 0) {
    console.error(`[${socketId}] ❌ Empty audio chunk received`);
    return false;
  }
  
  const isValidAudio = chunk.length > 100; // Minimum viable chunk size
  console.log(`[${socketId}] 🎵 Audio chunk: ${chunk.length} bytes, valid: ${isValidAudio}`);
  
  return isValidAudio;
}

function logStreamHealth(speechStream, socketId) {
  if (speechStream && typeof speechStream.getStreamHealth === 'function') {
    const health = speechStream.getStreamHealth();
    console.log(`[${socketId}] 💚 Stream Health:`, {
      active: health.isActive,
      lastActivity: new Date(health.lastActivity).toISOString(),
      transcriptLength: health.accumulatedLength,
      secondsSinceActivity: Math.round(health.timeSinceLastActivity / 1000)
    });
  }
}

// Initialize transcription for a socket
export function initializeTranscription(socket) {
  const socketId = socket.id;
  
  // Initialize session data
  activeSessions.set(socketId, {
    speechStream: null,
    isTranscribing: false
  });

  // Setup event listeners
  socket.on("startSpeechRecognition", () => {
    startTranscription(socket);
  });

  socket.on("audioChunk", (audioData) => {
    processAudioChunk(socket, audioData);
  });

  socket.on("stopSpeechRecognition", () => {
    stopTranscription(socket);
  });

  console.log(`[${socketId}] 🎙️ Transcription handler initialized`);
}

// Start transcription for a socket
function startTranscription(socket) {
  const socketId = socket.id;
  const session = activeSessions.get(socketId);

  if (!session) {
    console.error(`[${socketId}] No session found for transcription start`);
    return;
  }

  if (session.isTranscribing) {
    console.warn(`[${socketId}] Transcription already active`);
    socket.emit("transcription-error", { message: "Transcription already active" });
    return;
  }

  try {
    console.log(`[${socketId}] 🎙️ Starting speech recognition`);
    
    const speechStream = createSpeechStream({
      onPartialTranscript: (partialText) => {
        socket.emit("partial-transcription", { text: partialText });
      },

      onFinalTranscript: (finalText) => {
        console.log(`[${socketId}] 📝 Final segment: ${finalText}`);
        socket.emit("transcription", { text: finalText });
      },

      onError: (error, message) => {
        console.error(`[${socketId}] Speech error:`, error);
        socket.emit("transcription-error", { 
          message: message || "Speech recognition error",
          canRetry: true
        });
        cleanupSession(socketId);
      },

      onStreamStart: () => {
        session.isTranscribing = true;
        socket.emit("speechRecognitionStarted");
        console.log(`[${socketId}] ✅ Speech recognition started successfully`);
      },

      onStreamEnd: (completeTranscript) => {
        console.log(`[${socketId}] 📄 Stream ended: ${completeTranscript}`);
        socket.emit("transcriptionComplete", { text: completeTranscript });
        cleanupSession(socketId);
      },
    });

    const started = speechStream.startStream();
    if (!started) {
      throw new Error("Failed to start speech stream");
    }
    
    // Store the speech stream in session
    session.speechStream = speechStream;
    
  } catch (err) {
    console.error(`[${socketId}] Error starting transcription:`, err);
    socket.emit("transcription-error", { 
      message: "Failed to start speech recognition" 
    });
    cleanupSession(socketId);
  }
}

// Process audio chunk for a socket
function processAudioChunk(socket, audioData) {
  const socketId = socket.id;
  const session = activeSessions.get(socketId);

  if (!session || !session.speechStream || !session.isTranscribing) {
    console.warn(`[${socketId}] No active transcription stream for audio chunk`);
    return;
  }

  try {
    if (!session.speechStream.isActive()) {
      console.warn(`[${socketId}] Speech stream is not active`);
      socket.emit("transcription-error", { 
        message: "Speech stream inactive",
        canRetry: true 
      });
      return;
    }

    const chunk = Buffer.from(audioData);
    
    // Debug the audio chunk
    const isValidChunk = debugAudioChunk(chunk, socketId);
    if (!isValidChunk) {
      console.warn(`[${socketId}] Invalid audio chunk, skipping`);
      return;
    }
    
    const success = session.speechStream.writeAudio(chunk);
    if (!success) {
      console.warn(`[${socketId}] Failed to write audio chunk`);
    }
    
    // Log stream health periodically (10% of the time)
    if (Math.random() < 0.1) {
      logStreamHealth(session.speechStream, socketId);
    }
    
  } catch (err) {
    console.error(`[${socketId}] Error processing audio chunk:`, err);
    socket.emit("transcription-error", { 
      message: "Error processing audio data" 
    });
  }
}

// Stop transcription for a socket
function stopTranscription(socket) {
  const socketId = socket.id;
  console.log(`[${socketId}] 🛑 Stopping speech recognition`);
  
  const session = activeSessions.get(socketId);
  if (session && session.speechStream) {
    try {
      session.speechStream.endStream();
    } catch (err) {
      console.error(`[${socketId}] Error ending speech stream:`, err);
    }
  }
  
  cleanupSession(socketId);
  socket.emit("speechRecognitionStopped");
}

// Clean up session data
function cleanupSession(socketId) {
  const session = activeSessions.get(socketId);
  if (session) {
    session.speechStream = null;
    session.isTranscribing = false;
    console.log(`[${socketId}] 🧹 Session cleaned up`);
  }
}

// Destroy transcription session (call on disconnect)
export function destroyTranscription(socket) {
  const socketId = socket.id;
  console.log(`[${socketId}] 🗑️ Destroying transcription session`);
  
  const session = activeSessions.get(socketId);
  if (session && session.speechStream) {
    try {
      session.speechStream.endStream();
    } catch (err) {
      console.error(`[${socketId}] Error during cleanup:`, err);
    }
  }
  
  // Remove from active sessions
  activeSessions.delete(socketId);
}

// Get session info for debugging
export function getTranscriptionStatus(socketId) {
  const session = activeSessions.get(socketId);
  if (!session) {
    return { exists: false };
  }
  
  return {
    exists: true,
    isTranscribing: session.isTranscribing,
    hasStream: !!session.speechStream,
    isActive: session.speechStream ? session.speechStream.isActive() : false
  };
}

// Health check for all active sessions
export function getActiveSessionsCount() {
  return activeSessions.size;
}

export function getActiveSessionsHealth() {
  const health = {};
  for (const [socketId, session] of activeSessions) {
    health[socketId] = {
      isTranscribing: session.isTranscribing,
      hasStream: !!session.speechStream,
      isActive: session.speechStream ? session.speechStream.isActive() : false
    };
  }
  return health;
}