import jwt from "jsonwebtoken";

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id and role
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

export { generateToken };
