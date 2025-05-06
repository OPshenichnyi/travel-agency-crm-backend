import logger from "../utils/logger.js";

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  // Default error status and message
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Handle Sequelize specific errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({
      error: {
        status: 400,
        message: "Validation error",
        details: errors,
      },
    });
  }

  // Send error response
  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

export { errorMiddleware };
