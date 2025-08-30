import connectDB from "./config/db.config.js";
import { app } from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    const server = createServer(app);

    // init socket
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MONGO DB connection failed !!! ", err);
  });
