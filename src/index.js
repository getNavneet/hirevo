import connectDB from "./config/db.config.js";
import { app } from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./socket.js";
import { InterviewSocket } from "./sockets/interviewSocket.claude.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    const server = createServer(app);

    // init socket
    //Your backend is always listening for socket connections.
    // The frontend (React app) can connect at any time via io("http://localhost:8000") and the backend will accept that connection.
    // initSocket(server);
    InterviewSocket(server);

    server.listen(PORT, () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MONGO DB connection failed !!! ", err);
  });
