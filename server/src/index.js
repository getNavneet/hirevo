import connectDB from "./config/db.config.js";
import { app } from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
// import { InterviewSocket } from "./sockets/interviewSocket.js";
//handles all the interview sockets
import { InterviewSocket } from "./sockets/interviewSocket.newStream.js";
// import { InterviewSocket } from "./sockets/interviewSocket.webspeech.js";
dotenv.config();

const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    const server = createServer(app);

    // init socket
    //Your backend is always listening for socket connections.
    // The frontend (React app) can connect at any time via io("http://localhost:8001") and the backend will accept that connection.
    // initSocket(server);
    InterviewSocket(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MONGO DB connection failed !!! ", err);
  });
