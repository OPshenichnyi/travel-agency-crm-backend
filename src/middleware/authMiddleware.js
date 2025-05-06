import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

/**
 * Middleware to verify JWT token and add user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          status: 401,
          message: "Authentication required",
        },
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    const user = await User.findByPk(decoded.id);

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          status: 401,
          message: "User not found or deactivated",
        },
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: {
          status: 401,
          message: "Invalid or expired token",
        },
      });
    }

    next(error);
  }
};

export { authenticate };
