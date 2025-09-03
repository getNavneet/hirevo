import { getIo } from "../socket";


getIo.on('join_room', (room) => {
    socket.join(room); // Adds the socket to a room
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
    socket.emit('room_joined', room);
  });

  // Handle event when a user sends a message
  getIo.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });