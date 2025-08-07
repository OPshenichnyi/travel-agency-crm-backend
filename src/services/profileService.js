import { User } from "../models/index.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

/**
 * Get user profile by ID
 * @param {String} userId - User ID
 * @returns {Object} - User profile data
 */
const getUserProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "email",
        "role",
        "firstName",
        "lastName",
        "phone",
        "isActive",
        "createdAt",
      ],
    });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return user;
  } catch (error) {
    logger.error(`Failed to get user profile: ${error.message}`);
    throw error;
  }
};

/**
 * Update user profile
 * @param {String} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Object} - Updated user profile
 */
const updateUserProfile = async (userId, profileData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // Update only allowed fields
    const allowedFields = ["firstName", "lastName", "phone"];
    allowedFields.forEach((field) => {
      if (profileData[field] !== undefined) {
        user[field] = profileData[field];
      }
    });

    await user.save();

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  } catch (error) {
    logger.error(`Failed to update user profile: ${error.message}`);
    throw error;
  }
};

/**
 * Change user password
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @returns {Boolean} - Success status
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      const error = new Error("Current password is incorrect");
      error.status = 400;
      throw error;
    }

    // Hash password directly through bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Use update method instead of save to avoid hook issues
    await User.update({ password: hashedPassword }, { where: { id: userId } });

    return true;
  } catch (error) {
    logger.error(`Failed to change password: ${error.message}`);
    throw error;
  }
};
export { getUserProfile, updateUserProfile, changePassword };
