const express = require('express');
const {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask
} = require('../controllers/taskController.jsx');
const validateTaskId = require('../middleware/validatetask.jsx');

const router = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

router.get('/tasks', asyncHandler(getTasks));
router.post('/tasks', asyncHandler(createTask));
router.get('/tasks/:id', validateTaskId, asyncHandler(getTask));
router.put('/tasks/:id', validateTaskId, asyncHandler(updateTask));
router.delete('/tasks/:id', validateTaskId, asyncHandler(deleteTask));

router.all('/tasks/:id', (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return res.status(404).json({ success: false, error: 'Task not found' });
});

module.exports = router;
