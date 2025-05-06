import bcrypt from "bcryptjs";
import { User, Invitation } from "../models/index.js";
import { generateToken } from "./jwtService.js";
import logger from "../utils/logger.js";

/**
 * Login user with email and password
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} - User data and token
 */
// У функції login додайте логування
const login = async (email, password) => {
  try {
    // Знайти користувача за email
    const user = await User.findOne({ where: { email } });

    // Перевірити, чи існує користувач
    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Перевірити, чи користувач активний
    if (!user.isActive) {
      const error = new Error("Account is deactivated");
      error.status = 401;
      throw error;
    }
    // Перевірити пароль
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Генерувати JWT токен
    const token = generateToken(user);

    // Повернути дані користувача та токен
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};
/**
 * Register user with invitation token
 * @param {String} token - Invitation token
 * @param {Object} userData - User data (password, firstName, lastName, phone)
 * @returns {Object} - User data and token
 */
const register = async (token, userData) => {
  // Find invitation by token
  const invitation = await Invitation.findOne({
    where: {
      token,
      used: false,
    },
    include: [
      {
        model: User,
        as: "inviter",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  // Check if invitation exists and is valid
  if (!invitation) {
    const error = new Error("Invalid or expired invitation token");
    error.status = 400;
    throw error;
  }

  // Check if invitation has expired
  if (new Date() > invitation.expiresAt) {
    const error = new Error("Invitation has expired");
    error.status = 400;
    throw error;
  }

  try {
    // Create user
    const user = await User.create({
      email: invitation.email,
      role: invitation.role,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
    });

    // Mark invitation as used
    invitation.used = true;
    await invitation.save();

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  } catch (error) {
    logger.error(`Registration failed: ${error.message}`);
    throw error;
  }
};

export { login, register };
