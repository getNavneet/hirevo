import express from "express"
import cors from "cors"

const app = express()

import dotenv from "dotenv";
import { createServer } from "http";
import { sttSocket } from "./sockets/interviewSocket.webspeech.js";
dotenv.config();
    
app.use(cors())


const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    const server = createServer(app);

    // init socket
    //Your backend is always listening for socket connections.
    // The frontend (React app) can connect at any time via io("http://localhost:8000") and the backend will accept that connection.
    // initSocket(server);
    sttSocket(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MONGO DB connection failed !!! ", err);
  });
