const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL of our Vite frontend
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User connected to network matrix: ${socket.id}`);

  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.id} joined channel: ${roomName}`);
  });

  socket.on('send_message', (data) => {
    // Distribute incoming packets to everyone mapped inside this channel room
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from network matrix: ${socket.id}`);
  });
});

// Changed to 5001 to bypass your system port blockage
const PORT = 5001; 
server.listen(PORT, () => {
  console.log(`🚀 Cyber Server processing live on http://localhost:${PORT}`);
});