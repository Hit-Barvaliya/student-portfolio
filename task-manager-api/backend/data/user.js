const mongoose = require('mongoose');

const memoryUsers = [];
let nextMemoryUserId = 1;

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model('User', userSchema, 'users');

function getNextMemoryUserId() {
  return `user-${nextMemoryUserId++}`;
}

module.exports = { User, memoryUsers, getNextMemoryUserId };
