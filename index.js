require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')());

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Message Schema
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('A user connected.');

  // Emit previous messages
  Message.find().then(messages => socket.emit('previousMessages', messages));

  // Save & broadcast messages
  socket.on('chatMessage', async (data) => {
    const newMessage = new Message(data);
    await newMessage.save();
    io.emit('chatMessage', newMessage);
  });

  socket.on('disconnect', () => console.log('A user disconnected.'));
});

// Routes
app.get('/', (req, res) => res.send('Chat App is running.'));

// Start the server
server.listen(3000, () => console.log('Server is running on http://localhost:3000'));
