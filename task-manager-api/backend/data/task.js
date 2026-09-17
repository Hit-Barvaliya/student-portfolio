const mongoose = require('mongoose');

const memoryTasks = [];
let nextMemoryTaskId = 1;

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

function getNextMemoryTaskId() {
  return `task-${nextMemoryTaskId++}`;
}

module.exports = { Task, memoryTasks, getNextMemoryTaskId };
