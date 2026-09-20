const mongoose = require('mongoose');

function validateTaskId(req, res, next) {
  const { id } = req.params;
  const isMongoId = mongoose.Types.ObjectId.isValid(id);
  const isLegacyId = /^task-\d+$/.test(id);

  if (!isMongoId && !isLegacyId) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid task ID'
    });
  }

  next();
}

module.exports = validateTaskId;
