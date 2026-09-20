const express = require('express');
const { login, register } = require('../controllers/authController.jsx');
const { validateLogin, validateRegistration } = require('../middleware/validateRequest.jsx');

const router = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

router.post('/auth/register', validateRegistration, asyncHandler(register));
router.post('/auth/login', validateLogin, asyncHandler(login));

module.exports = router;
