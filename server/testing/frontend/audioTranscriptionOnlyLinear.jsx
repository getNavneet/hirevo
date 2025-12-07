import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState(
    'Press "Start Recording" and begin speaking.'
  );
  const [transcription, setTranscription] = useState("");
  const [partialTranscription, setPartialTranscription] = useState("");

  // Refs to keep stable instances
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const streamRef = useRef(null);

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

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // 🔹 Helper: convert Float32 samples → Int16 PCM
  const floatTo16BitPCM = (float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // --- STOP ---
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.emit("stopSpeechRecognition");
      }
      setIsRecording(false);
      setStatus("Recording stopped. Waiting for final transcription...");
    } else {
      // --- START ---
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new AudioContext(); // default ~48kHz
        audioContextRef.current = audioContext;

        // Load worklet
        await audioContext.audioWorklet.addModule("/pcm-processor.js");

        const source = audioContext.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
        workletNodeRef.current = workletNode;

        source.connect(workletNode);

        // Tell server we’re starting
        socketRef.current.emit("startSpeechRecognition");

        // Listen for messages from processor
        workletNode.port.onmessage = (event) => {
          const float32Array = event.data;
          const pcmBuffer = floatTo16BitPCM(float32Array);
          if (socketRef.current) {
            socketRef.current.emit("audioChunk", pcmBuffer);
          }
        };

        setIsRecording(true);
        setTranscription("");
        setPartialTranscription("");
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
        <button onClick={handleToggleRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <div id="status">{status}</div>
      <hr />
      <div id="partial-transcription">
        <p>
          {partialTranscription ||
            "Partial transcription will appear here..."}
        </p>
      </div>
      <hr />
      <div id="transcription">
        <p>{transcription || "Final transcription will appear here..."}</p>
      </div>
    </div>
  );
};

export default App;




//public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0]) {
      // Send Float32 samples back to main thread
      this.port.postMessage(input[0]);
    }
    return true; // keep processor alive
  }
}

registerProcessor("pcm-processor", PCMProcessor);
