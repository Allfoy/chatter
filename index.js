require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "https://allfoy.github.io",
		methods: ["GET", "POST"],
	},
});

// Middleware
const cors = require("cors");

// Allow your GitHub Pages origin
app.use(cors({ origin: "https://allfoy.github.io" }));

// Other middleware (like express.json) below this
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Setup
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Connected to MongoDB!"))
	.catch((err) => console.error("MongoDB connection error:", err));

// Message Schema
const messageSchema = new mongoose.Schema({
	username: String,
	message: String,
	timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// serverStartTime Schema
const serverStartTimeSchema = new mongoose.Schema({
	timeDay: String,
    timeDifference: Number,
});
const serverStartTime = mongoose.model("serverStartTime", serverStartTimeSchema);

// Socket.io chat
io.on("connection", (socket) => {
	console.log("A user connected.");
	// Emit previous messages
	Message.find().then((messages) =>
		socket.emit("previousMessages", messages)
	);
	// Save & broadcast messages
	socket.on("chatMessage", async (data) => {
		const newMessage = new Message(data);
		await newMessage.save();
		io.emit("chatMessage", newMessage);
	});
	socket.on("disconnect", () => console.log("A user disconnected."));
    // socket.io confetti button
    socket.on('classIconClicked', () => io.emit('confetti'));
    // save serverStartTime to mongodb
    socket.on("serverStartTime", async (arg) => {
        //send arg to mongodb
        const newserverStartTime = new serverStartTime(arg);
		await newserverStartTime.save();
    });
});

// Routes
app.get("/", (req, res) => res.send("Chat App is running."));

// Start the server
server.listen(3000, () =>
	console.log("Server is running on https://chatter-ioha.onrender.com")
);
