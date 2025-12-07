// client/src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

// The socket should be initialized within the component's lifecycle, not in the module scope.
// This ensures a new connection for each component instance and proper cleanup.

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState(
    'Press "Start Recording" and begin speaking.'
  );
  const [transcription, setTranscription] = useState("");
  const [partialTranscription, setPartialTranscription] = useState("");

  // Use refs for stable references to the socket and media recorder across re-renders.
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:8000", {
      transports: ["websocket"],
    });

    socketRef.current.on("partial-transcription", ({ text }) => {
      setPartialTranscription(text);
    });

    socketRef.current.on("transcription", ({ text }) => {
      setTranscription((prev) => prev + " " + text);
      setStatus("Press Start Recording to begin a new session.");
    });

    socketRef.current.on("transcription-error", (error) => {
      setStatus(`Error: ${error}`);
      setIsRecording(false);
    });

    socketRef.current.on("speechRecognitionStarted", () => {
      setStatus("Recording... Speak now!");
    });

    socketRef.current.on("speechRecognitionStopped", () => {
      setStatus("Stopped. Waiting for final transcription...");
    });

    return () => socketRef.current.disconnect();
  }, []);
  const handleToggleRecording = async () => {
    if (isRecording) {
      // --- STOP RECORDING ---
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop(); // This will trigger the 'onstop' event handler
      }
      setIsRecording(false);
      setStatus("Recording stopped. Sending to server...");
    } else {
      // --- START RECORDING ---
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        // mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        
        // 1. Tell the server to start a new stream for this client
        socketRef.current.emit("startSpeechRecognition");

        // 2. Set up the event handler for when audio data is available
        mediaRecorderRef.current.ondataavailable = async (event) => {
          if (event.data.size > 0 && socketRef.current) {
            const arrayBuffer = await event.data.arrayBuffer();
            socketRef.current.emit("audioChunk", arrayBuffer); // send raw binary
          }
        };

        // 3. Set up the event handler for when the recording is stopped
        mediaRecorderRef.current.onstop = () => {
          if (socketRef.current) {
            socketRef.current.emit("stopSpeechRecognition");
          }
          setPartialTranscription("");
          setTranscription("");
          // The status is already set when the button is clicked.
          // We wait for the server to send back the transcription status.
        };

        mediaRecorderRef.current.start(300); // Capture audio in 1-second chunks
        setIsRecording(true);
        setTranscription(""); // Clear any previous transcription
        setStatus("Recording... Speak now!");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setStatus("Error: Could not access microphone.");
      }
    }
  };

  return (
    <div className="container">
      <h1>Live Transcription 🎙️</h1>
      <div className="controls">
        <button
          onClick={handleToggleRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <div id="status">{status}</div>
      <hr />
      <div id="partial-transcription">
        <p>{partialTranscription || "partial transcription will appear here..."}</p>
      </div>
      <hr />
      <div id="transcription">
        <p>{transcription || "Transcription will appear here..."}</p>
      </div>
    </div>
  );
};

export default App;
