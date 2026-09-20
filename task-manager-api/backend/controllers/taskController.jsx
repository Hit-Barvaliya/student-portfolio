const { Task, memoryTasks, getNextMemoryTaskId } = require('../data/task');

let isMongoConnected = false;

function setMongoConnectionState(connected) {
  isMongoConnected = connected;
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

  return { ...task, id: task.id };
}

async function getTasks(req, res) {
  if (isMongoConnected) {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, tasks: tasks.map(serializeTask) });
  }

  return res.status(200).json({ success: true, tasks: memoryTasks.map(serializeTask) });
}

async function createTask(req, res) {
  const { title, description, dueDate, priority, status } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Missing required task fields' });
  }

  const taskData = {
    id: getNextMemoryTaskId(),
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
}

async function getTask(req, res) {
  const { id } = req.params;
  const task = isMongoConnected
    ? await Task.findById(id)
    : memoryTasks.find((taskItem) => taskItem.id === id || taskItem._id?.toString?.() === id);

  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  return res.status(200).json({ success: true, task: serializeTask(task) });
}

async function updateTask(req, res) {
  const { id } = req.params;

  if (isMongoConnected) {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    return res.status(200).json({ success: true, task: serializeTask(updatedTask) });
  }

  const taskIndex = memoryTasks.findIndex((task) => task.id === id || task._id?.toString?.() === id);
  if (taskIndex === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  const updatedTask = { ...memoryTasks[taskIndex], ...req.body, id, updatedAt: new Date() };
  memoryTasks[taskIndex] = updatedTask;
  return res.status(200).json({ success: true, task: serializeTask(updatedTask) });
}

async function deleteTask(req, res) {
  const { id } = req.params;

  if (isMongoConnected) {
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  }

  const taskIndex = memoryTasks.findIndex((task) => task.id === id || task._id?.toString?.() === id);
  if (taskIndex === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  memoryTasks.splice(taskIndex, 1);
  return res.status(200).json({ success: true, message: 'Task deleted successfully' });
}

module.exports = {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  setMongoConnectionState,
  updateTask
};
