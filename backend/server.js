const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:3005'];

app.use(cors({
  origin: function (origin, callback) {
    console.log("Incoming origin:", origin);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS. Allowed origins:", allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 5005;

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leave-count');
    isConnected = db.connections[0].readyState;
    console.log('MongoDB connected (Serverless)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workdays', require('./routes/workDayRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
