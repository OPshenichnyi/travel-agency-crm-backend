import { registerFirstAdmin } from "../services/adminService.js";

/**
 * Register first admin controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const registerFirstAdminController = async (req, res, next) => {
  try {
    const adminData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
    };

    const result = await registerFirstAdmin(adminData);

    res.status(201).json({
      message: "Admin user created successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export { registerFirstAdminController };
