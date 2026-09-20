function invalid(res, error) {
  return res.status(400).json({ success: false, error });
}

function validateRegistration(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return invalid(res, 'A valid email is required');
  }

  if (typeof password !== 'string' || password.length < 6) {
    return invalid(res, 'Password must be at least 6 characters');
  }

  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return invalid(res, 'Email and password are required');
  }

  return next();
}

function validateTaskPayload(req, res, next) {
  const { title, description } = req.body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return invalid(res, 'Title is required');
  }

  if (typeof description !== 'string' || !description.trim()) {
    return invalid(res, 'Description is required');
  }

  return next();
}

module.exports = { validateLogin, validateRegistration, validateTaskPayload };
