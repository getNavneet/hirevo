let io;

export const initSocket = async(server) => {
  const { Server } = await import("socket.io"); // dynamic import since top-level used elsewhere
  io = new Server(server, {
    cors: {
      origin: "*", // frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    console.log("Socket.io not initialized!");
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
