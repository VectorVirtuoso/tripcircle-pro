const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
// Note: This will throw an error until you put your real MONGO_URI in the .env file
connectDB(); 

// Initialize Express
const app = express();

// Middleware
app.use(cors()); // Allows our frontend to communicate with our backend
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// API Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/settlements', require('./routes/settlementRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Create HTTP server (required for Socket.io integration later)
const server = http.createServer(app);

// Initialize Socket.io
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Our Vite frontend URL
    methods: ["GET", "POST"]
  }
});

// Socket.io Real-Time Logic
io.on("connection", (socket) => {
  console.log(`User connected to live socket: ${socket.id}`);

  // 1. When a user opens a trip page, they "join" a specific room
  socket.on("join_trip", (tripId) => {
    socket.join(tripId);
    console.log(`User joined trip room: ${tripId}`);
  });

  // 2. When someone adds an expense, they tell the server...
  socket.on("expense_added", (tripId) => {
    // 3. ...and the server shouts to EVERYONE ELSE in that room to refresh!
    socket.to(tripId).emit("update_trip_data");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('TripCircle Pro API is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});