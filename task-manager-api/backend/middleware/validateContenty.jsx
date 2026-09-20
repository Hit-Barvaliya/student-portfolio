function validateContentType(req, res, next) {
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

module.exports = validateContentType;
