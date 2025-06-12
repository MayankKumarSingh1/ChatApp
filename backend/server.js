const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectToDB = require('./config/db');
const cookieParser = require('cookie-parser');
const userRoute = require('./router/user.routes');

connectToDB();
const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);

const allowedOrigins =
  "https://chat-1zeijq5qj-mayankkumarsingh1s-projects.vercel.app"
;
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Connected to backend");
});


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on("send_message", ({ room, message, sender }) => {
    const msgPayload = {
      sender,
      from: sender,
      to: room.split("-").find(id => id !== sender),
      text: message,
      time: new Date().toISOString()
    };
    socket.to(room).emit("receive_message", msgPayload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use('/api', userRoute);


app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});



server.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
