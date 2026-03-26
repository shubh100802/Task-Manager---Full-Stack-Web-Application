const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./errorMiddleware');

// ========== auth gate for private routes ==========
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ========== token should come as Bearer <token> ==========
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  // ========== decode and fetch user once so controllers can trust req.user ==========
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  req.user = await User.findById(decoded.id).select('-password');
  
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  next();
});

module.exports = protect;
