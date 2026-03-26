const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// ========== load env before touching anything else ==========
dotenv.config();

// ========== fail fast if db is unavailable ==========
connectDB();

const app = express();

// ========== basic middleware ==========
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
}));
app.use(express.json());

// ========== app routes ==========
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// ========== quick ping route for sanity checks ==========
app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API is running' });
});

// ========== not found fallback ==========
app.use(notFound);

// ========== centralized error response ==========
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
