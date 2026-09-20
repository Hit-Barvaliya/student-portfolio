const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, memoryUsers, getNextMemoryUserId } = require('../data/user');

const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret-change-me';
let isMongoConnected = false;

function setUserMongoConnectionState(connected) {
  isMongoConnected = connected;
}

function serializeUser(user) {
  return {
    id: user._id?.toString?.() || user.id,
    email: user.email
  };
}

function signToken(user) {
  return jwt.sign({ id: user._id?.toString?.() || user.id }, JWT_SECRET, {
    expiresIn: '1h'
  });
}

async function register(req, res) {
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;
  const existingUser = isMongoConnected
    ? await User.findOne({ email })
    : memoryUsers.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({ success: false, error: 'Email is already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userData = { email, password: hashedPassword };
  const user = isMongoConnected
    ? await User.create(userData)
    : { ...userData, id: getNextMemoryUserId() };

  if (!isMongoConnected) memoryUsers.push(user);

  return res.status(201).json({ success: true, user: serializeUser(user) });
}

async function login(req, res) {
  const email = req.body.email.trim().toLowerCase();
  const user = isMongoConnected
    ? await User.findOne({ email })
    : memoryUsers.find((userItem) => userItem.email === email);

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  return res.status(200).json({
    success: true,
    token: signToken(user),
    user: serializeUser(user)
  });
}

module.exports = { login, register, setUserMongoConnectionState };
