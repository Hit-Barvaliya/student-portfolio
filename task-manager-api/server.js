const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./backend/middleware/logger.jsx');
const validateContentType = require('./backend/middleware/validateContenty.jsx');
const errorHandler = require('./backend/middleware/errorhandler.jsx');
const taskRouter = require('./backend/router/taskrouter.jsx');
const { setMongoConnectionState } = require('./backend/controllers/taskController.jsx');

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(logger);
app.use(validateContentType);
app.use(express.json());
app.use(taskRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

async function connectToMongo() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_db';

  try {
    await mongoose.connect(mongoUri);
    setMongoConnectionState(true);
    console.log(`MongoDB connected to ${mongoUri}`);
  } catch (error) {
    setMongoConnectionState(false);
    console.warn('MongoDB connection failed, using in-memory storage:', error.message);
  }
}

if (require.main === module) {
  connectToMongo();
  app.listen(5000, () => console.log('Server running on port 5000'));
}

module.exports = { app };
