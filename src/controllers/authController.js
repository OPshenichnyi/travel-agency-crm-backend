import { login, register } from "../services/index.js";

/**
 * Login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Register controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const registerController = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userData = {
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
    };

    const result = await register(token, userData);

    res.status(201).json({
      message: "Registration successful",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export { loginController, registerController };
