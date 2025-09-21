import WebSocket from "ws";
import stream from "stream";

const ASSEMBLYAI_WS_URL = "wss://streaming.assemblyai.com/v3/ws";
const API_KEY = process.env.ASSEMBLYAI_API_KEY; // set your key

// Default config for AssemblyAI streaming
const ASSEMBLY_CONFIG = {
  // Format params
  sample_rate: 16000, // AssemblyAI default/required
  encoding: "pcm_s16le", // raw PCM, 16-bit signed little endian (or whatever they support)
  interim_results: true, // receive partial transcripts
  // options for end-of-turn detection (optional)
  end_of_turn_confidence_threshold: 0.7,
  min_end_of_turn_silence_when_confident: 160, // in ms or samples (check docs)
  max_turn_silence: 2000, // maximum allowed silence in a turn
  formatted_finals: true, // whether final results are nicely formatted (punctuation, casing etc.)
};

function createSpeechStream(callbacks = {}) {
  let ws = null;
  let audioInput = null;
  let isStreamActive = false;
  let transcribed = "";

  const {
    onPartialTranscript = () => {},
    onFinalTranscript = () => {},
    onError = () => {},
    onStreamStart = () => {},
    onStreamEnd = () => {},
  } = callbacks;

  function startStream() {
    if (isStreamActive) {
      console.warn("AssemblyAI stream already active");
      return false;
    }

    if (!API_KEY) {
      onError(new Error("Missing AssemblyAI API key"), "Configuration error");
      return false;
    }

    console.log("📡 Starting AssemblyAI speech recognition stream");

    try {
      isStreamActive = true;
      transcribed = "";

      audioInput = new stream.PassThrough();

      onStreamStart();

      // Open WebSocket connection
      ws = new WebSocket(ASSEMBLYAI_WS_URL, {
        headers: {
          Authorization: API_KEY,
        },
      });
    //   ws.on("open", () => {
    //     const configMsg = {
    //       type: "StartRequest",
    //       sample_rate: 16000, // match your audio source
    //       encoding: "pcm_s16le", // 16-bit signed PCM, little endian
    //       interim_results: true,
    //     };
    //     ws.send(JSON.stringify(configMsg));

    //     // now safe to send audio
    //     audioInput.on("data", (chunk) => {
    //       if (ws.readyState === WebSocket.OPEN) {
    //         ws.send(chunk);
    //       }
    //     });
    //   });
    //   ws.on("open", () => {
    //     // send config as first message
    //     const configMsg = {
    //       type: "StartStream",
    //       ...ASSEMBLY_CONFIG,
    //     };
    //     ws.send(JSON.stringify(configMsg));

    //     // pipe audioInput into ws
    //     audioInput.on("data", (chunk) => {
    //       if (ws.readyState === WebSocket.OPEN) {
    //         // send audio as binary
    //         ws.send(chunk);
    //       }
    //     });
    //   });

      ws.on("message", (data) => {
        // data might come as JSON
        let msg;
        try {
          msg = JSON.parse(data);
        } catch (e) {
          console.error("Could not parse AssemblyAI message", e);
          return;
        }

        // handle events
        switch (msg.type) {
          case "PartialTranscript":
            // msg.text has partial
            onPartialTranscript(msg.text);
            break;
          case "FinalTranscript":
            // msg.text is a final piece
            transcribed += msg.text + " ";
            onFinalTranscript(msg.text);
            break;
          case "TurnTranscript":
            // maybe they have turns (end of speaking turn) event
            // optional: if you want to treat "turn" as final boundary
            // you might also send onFinalTranscript here or special callback
            break;
          case "Error":
            onError(new Error(msg.error), "AssemblyAI error event");
            break;
          case "SessionEnded":
            // or whatever AssemblyAI uses when stream ends
            isStreamActive = false;
            onStreamEnd(transcribed.trim());
            break;
          default:
            // other event types you may ignore/debug
            break;
        }
      });

      ws.on("close", (code, reason) => {
        console.log("WebSocket closed:", code, reason);
        if (isStreamActive) {
          isStreamActive = false;
          onStreamEnd(transcribed.trim());
        }
      });

      ws.on("error", (err) => {
        console.error("AssemblyAI WS error:", err);
        isStreamActive = false;
        onError(err, "WebSocket error");
      });

      // return true indicates started
      return true;
    } catch (err) {
      console.error("Error starting AssemblyAI stream:", err);
      isStreamActive = false;
      onError(err, "Failed to start AssemblyAI streaming");
      return false;
    }
  }

  function writeAudio(chunk) {
    try {
      if (audioInput && isStreamActive) {
        return audioInput.write(chunk);
      } else {
        console.warn(
          "Attempted to write audio but assembly stream is not active"
        );
        return false;
      }
    } catch (err) {
      console.error("Error writing audio chunk to AssemblyAI:", err);
      onError(err, "Error writing audio");
      return false;
    }
  }

  function endStream() {
    console.log("🛑 Ending AssemblyAI speech stream");

    if (!isStreamActive) {
      // Already ended or not started
      onStreamEnd(transcribed.trim());
      return;
    }

    isStreamActive = false;

    try {
      if (audioInput) {
        audioInput.end();
        audioInput = null;
      }
    } catch (err) {
      console.error("Error ending audio input stream:", err);
    }

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // AssemblyAI expects a specific message to end
        const stopMsg = { type: "StopStream" };
        ws.send(JSON.stringify(stopMsg));
      }
      // Close ws
      ws.close();
      ws = null;
    } catch (err) {
      console.error("Error ending WebSocket connection:", err);
    }

    onStreamEnd(transcribed.trim());
  }

  function getAccumulatedTranscript() {
    return transcribed.trim();
  }

  function isActive() {
    return isStreamActive;
  }

  return {
    startStream,
    writeAudio,
    endStream,
    getAccumulatedTranscript,
    isActive,
  };
}

export { createSpeechStream };
