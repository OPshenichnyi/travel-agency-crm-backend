/**
 * Middleware to check if user has required role
 * @param {Array|String} roles - Role or array of roles allowed to access the route
 * @returns {Function} - Express middleware function
 */
const checkRole = (roles) => {
  // Convert single role to array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // Check if user exists and has required role
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          status: 403,
          message: "Access denied: insufficient permissions",
        },
      });
    }

    next();
  };
};

export { checkRole };
