const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const response = {
    message: err.message || 'Error interno del servidor',
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (env.nodeEnv === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

function notFoundMiddleware(req, res, next) {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorMiddleware, notFoundMiddleware };
