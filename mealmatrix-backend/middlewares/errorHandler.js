// Centralized error handler — every controller just calls next(err),
// nobody writes their own res.status(500).json(...) inline anymore.
// Interview point: "I centralized error handling so response shape is
// consistent everywhere and I can log every failure in one place."

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.message);

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Something went wrong',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// Custom error class so controllers can throw with a specific status code
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
