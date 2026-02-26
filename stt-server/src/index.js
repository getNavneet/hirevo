import { createServer } from "http";
import { sttSocket } from "../src/stt/sttSocket.js"; 
import dotenv from "dotenv";
dotenv.config();

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "stt server is running", time: new Date() }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

sttSocket(server);

// Start listening
const PORT = process.env.PORT || 8001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`STT server listening on port ${PORT}`);
});
