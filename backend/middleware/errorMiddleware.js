// ========== single place for turning thrown errors into API responses ==========
const errorHandler = (errorObj, req, res, next) => {
  let normalizedError = { ...errorObj };
  normalizedError.message = errorObj.message;

  console.error(errorObj);

  // ========== mongoose validation issues ==========
  if (errorObj.name === 'ValidationError') {
    const message = Object.values(errorObj.errors).map(val => val.message).join(', ');
    normalizedError = {
      message,
      statusCode: 400
    };
  }

  // ========== duplicate key usually means repeated email ==========
  if (errorObj.code === 11000) {
    const message = 'Duplicate field value entered';
    normalizedError = {
      message,
      statusCode: 400
    };
  }

  // ========== invalid ObjectId and similar casts ==========
  if (errorObj.name === 'CastError') {
    const message = 'Resource not found';
    normalizedError = {
      message,
      statusCode: 404
    };
  }

  // ========== invalid token ==========
  if (errorObj.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    normalizedError = {
      message,
      statusCode: 401
    };
  }

  // ========== expired token ==========
  if (errorObj.name === 'TokenExpiredError') {
    const message = 'Token expired';
    normalizedError = {
      message,
      statusCode: 401
    };
  }

  const statusCode = errorObj.statusCode || normalizedError.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: normalizedError.message || 'Server Error'
  });
};

// ========== fallback when route does not exist ==========
const notFound = (req, res, next) => {
  const notFoundError = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(notFoundError);
};

// ========== tiny helper so controllers can throw instead of try/catch everywhere ==========
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
