import { User } from "../models/index.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "./jwtService.js";
import logger from "../utils/logger.js";

/**
 * Register a new admin if no admins exist
 * @param {Object} adminData - Admin user data
 * @returns {Object} - Admin data and token
 */
const registerFirstAdmin = async (adminData) => {
  try {
    // Check if any admin already exists
    const adminExists = await User.findOne({ where: { role: "admin" } });

    if (adminExists) {
      const error = new Error("Admin user already exists");
      error.status = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = await User.create({
      id: uuidv4(),
      role: "admin",
      email: adminData.email,
      password: hashedPassword,
      firstName: adminData.firstName || "Admin",
      lastName: adminData.lastName || "User",
      phone: adminData.phone,
      isActive: true,
    });

    // Generate JWT token
    const token = generateToken(admin);

    // Return admin data and token
    return {
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
      token,
    };
  } catch (error) {
    logger.error(`Admin registration failed: ${error.message}`);
    throw error;
  }
};

export { registerFirstAdmin };
