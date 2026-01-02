import { createServer } from "http";
import { sttSocket } from "../src/stt/sttSocket.js"; 
import dotenv from "dotenv";
dotenv.config();

const server = createServer();

sttSocket(server);

// Start listening
const PORT = process.env.PORT || 8001;
server.listen(8001, '0.0.0.0', () => {
  console.log('STT server listening on port 8001');
});
