import bcrypt from "bcryptjs";
import { User, Invitation } from "../models/index.js";
import { generateToken } from "./jwtService.js";
import logger from "../utils/logger.js";

/**
 * Authentication service
 * This module handles all authentication-related operations including login and registration
 *
 * @module authService
 */

/**
 * Login user with email and password
 * Performs the following steps:
 * 1. Validates user existence
 * 2. Checks if account is active
 * 3. Verifies password
 * 4. Generates JWT token
 *
 * @param {String} email - User email
 * @param {String} password - User password (plain text)
 * @returns {Object} - User data and JWT token
 * @throws {Error} - If authentication fails
 */
const login = async (email, password) => {
  try {
    logger.info(`Attempting login for email: ${email}`);

    // Step 1: Find and validate user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn(`User not found for email: ${email}`);
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Step 2: Check account status
    if (!user.isActive) {
      logger.warn(`Account is deactivated for email: ${email}`);
      const error = new Error("Account is deactivated");
      error.status = 401;
      throw error;
    }

    // Step 3: Verify password
    logger.info("Verifying password...");
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn(`Invalid password for user: ${email}`);
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Step 4: Generate authentication token
    const token = generateToken(user);
    logger.info(`Login successful for user: ${email}`);

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
    logger.error(`Login error for ${email}: ${error.message}`);
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
  // Знаходимо запрошення за токеном
  const invitation = await Invitation.findOne({
    where: {
      token,
      used: false,
    },
    include: [
      {
        model: User,
        as: "inviter",
        attributes: ["id", "firstName", "lastName", "email", "role"],
      },
    ],
  });

  // Перевіряємо, чи існує запрошення і чи воно валідне
  if (!invitation) {
    const error = new Error("Invalid or expired invitation token");
    error.status = 400;
    throw error;
  }

  // Перевіряємо, чи запрошення не прострочене
  if (new Date() > invitation.expiresAt) {
    const error = new Error("Invitation has expired");
    error.status = 400;
    throw error;
  }

  try {
    // Визначаємо managerId для агентів
    let managerId = null;
    if (invitation.role === "agent" && invitation.inviter) {
      // Якщо запрошувач - менеджер, його ID стає managerId
      if (invitation.inviter.role === "manager") {
        managerId = invitation.inviter.id;
      }
      // Якщо запрошувач - адмін, залишаємо managerId як null (або ви можете вибрати інший підхід)
    }

    // Створюємо користувача
    const user = await User.create({
      email: invitation.email,
      role: invitation.role,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      managerId: managerId,
    });

    // Позначаємо запрошення як використане
    invitation.used = true;
    await invitation.save();

    // Генеруємо JWT токен
    const token = generateToken(user);

    // Повертаємо дані користувача та токен
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        managerId: user.managerId,
      },
      token,
    };
  } catch (error) {
    logger.error(`Registration failed: ${error.message}`);
    throw error;
  }
};

export { login, register };
