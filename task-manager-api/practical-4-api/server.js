const express = require('express');

const app = express();
const tasks = [];
let nextTaskId = 1;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

function findTask(id) {
  return tasks.find((task) => task.id === Number(id));
}

app.get('/tasks', (req, res) => {
  res.status(200).json({ success: true, tasks });
});

app.post('/tasks', (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    const task = {
      id: nextTaskId++,
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    return res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

app.get('/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  return res.status(200).json({ success: true, task });
});

app.put('/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const { title, description, completed } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = completed;

  return res.status(200).json({ success: true, task });
});

app.delete('/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex((task) => task.id === Number(req.params.id));

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  return res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong' });
});

if (require.main === module) {
  app.listen(5001, () => console.log('Practical 4 server running on port 5001'));
}

module.exports = { app, tasks };
