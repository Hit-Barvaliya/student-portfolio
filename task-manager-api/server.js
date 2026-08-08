const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const router = express.Router();
const memoryTasks = [];
let nextMemoryTaskId = 1;
let isMongoConnected = false;

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, default: Date.now },
    priority: { type: String, default: 'normal' },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

taskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Task = mongoose.model('Task', taskSchema, 'tasks');

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

function validateJsonContentType(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
}

app.use(validateJsonContentType);
app.use(express.json());

function validateTaskId(req, res, next) {
  const { id } = req.params;
  const isMongoId = mongoose.Types.ObjectId.isValid(id);
  const isLegacyId = /^task-\d+$/.test(id);

  if (!isMongoId && !isLegacyId) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid task ID'
    });
  }

  next();
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function serializeTask(task) {
  if (!task) return null;
  if (task.toObject) {
    const plainTask = task.toObject();
    return {
      ...plainTask,
      id: plainTask._id?.toString?.() || plainTask.id
    };
  }

  return {
    ...task,
    id: task.id
  };
}

async function connectToMongo() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_db';

  try {
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    console.log(`MongoDB connected to ${mongoUri}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn('MongoDB connection failed, using in-memory storage:', error.message);
  }
}

if (require.main === module) {
  connectToMongo();
}

router.get('/tasks', asyncHandler(async (req, res) => {
  if (isMongoConnected) {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, tasks: tasks.map(serializeTask) });
  }

  return res.status(200).json({ success: true, tasks: memoryTasks.map(serializeTask) });
}));

router.post('/tasks', asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, status } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Missing required task fields' });
  }

  const taskData = {
    id: `task-${nextMemoryTaskId++}`,
    title,
    description,
    dueDate: dueDate ? new Date(dueDate) : new Date(),
    priority: priority || 'normal',
    status: status || 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (isMongoConnected) {
    const task = await Task.create(taskData);
    return res.status(201).json({ success: true, task: serializeTask(task) });
  }

  memoryTasks.push(taskData);
  return res.status(201).json({ success: true, task: serializeTask(taskData) });
}));

router.get('/tasks/:id', validateTaskId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    return res.status(200).json({ success: true, task: serializeTask(task) });
  }

  const task = memoryTasks.find((taskItem) => taskItem.id === id || taskItem._id?.toString?.() === id);

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  return res.status(200).json({ success: true, task: serializeTask(task) });
}));

router.put('/tasks/:id', validateTaskId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    return res.status(200).json({ success: true, task: serializeTask(updatedTask) });
  }

  const taskIndex = memoryTasks.findIndex((task) => task.id === id || task._id?.toString?.() === id);

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const updatedTask = { ...memoryTasks[taskIndex], ...req.body, id, updatedAt: new Date() };
  memoryTasks[taskIndex] = updatedTask;
  return res.status(200).json({ success: true, task: serializeTask(updatedTask) });
}));

router.delete('/tasks/:id', validateTaskId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  }

  const taskIndex = memoryTasks.findIndex((task) => task.id === id || task._id?.toString?.() === id);

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  memoryTasks.splice(taskIndex, 1);
  return res.status(200).json({ success: true, message: 'Task deleted successfully' });
}));

router.all('/tasks/:id', (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return res.status(404).json({ success: false, error: 'Task not found' });
});

app.use(router);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong' });
});

module.exports = { app, memoryTasks };

if (require.main === module) {
  app.listen(5000, () => console.log('Server running on port 5000'));
}
