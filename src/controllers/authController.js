import { login, register } from "../services/index.js";
import logger from "../utils/logger.js";

/**
 * Login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Log incoming request data
    logger.info(
      `Login attempt - Email: ${email}, Password length: ${password?.length}`
    );
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);

    const result = await login(email, password);
    logger.info("Login successful");
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Login failed: ${error.message}`);
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

    // Log registration attempt
    logger.info(`Registration attempt with token: ${token}`);
    logger.info(
      `User data: ${JSON.stringify({ ...userData, password: "***" })}`
    );

    const result = await register(token, userData);

    logger.info("Registration successful");
    res.status(201).json({
      message: "Registration successful",
      ...result,
    });
  } catch (error) {
    logger.error(`Registration failed: ${error.message}`);
    next(error);
  }
};

export { loginController, registerController };
