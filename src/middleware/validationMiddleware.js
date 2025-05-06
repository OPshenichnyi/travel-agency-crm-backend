import { validationResult } from "express-validator";

/**
 * Middleware to validate request data using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        status: 422,
        message: "Validation failed",
        details: errors.array().map((err) => err.msg),
      },
    });
  }
  next();
};

export { validate };
