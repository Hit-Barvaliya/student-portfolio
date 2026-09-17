function errorHandler(err, req, res, _next) {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong' });
}

module.exports = errorHandler;
