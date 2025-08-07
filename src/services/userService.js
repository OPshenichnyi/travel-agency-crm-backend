import { User } from "../models/index.js";
import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";
import sequelize from "../config/database.js";

/**
 * Toggle user active status (block/unblock)
 * @param {String} userId - ID of the user to toggle status
 * @param {Boolean} isActive - New active status
 * @returns {Object} - Updated user
 */
const toggleUserStatus = async (userId, isActive) => {
  try {
    // Find user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // Admin cannot be blocked
    if (user.role === "admin") {
      const error = new Error("Admin users cannot be blocked");
      error.status = 403;
      throw error;
    }

    // Use raw SQL query through sequelize
    await sequelize.query(`UPDATE users SET isActive = ? WHERE id = ?`, {
      replacements: [isActive ? 1 : 0, userId],
      type: sequelize.QueryTypes.UPDATE,
    });

    // Update data in the model
    user.isActive = isActive;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  } catch (error) {
    logger.error(`Failed to toggle user status: ${error.message}`);
    throw error;
  }
};
/**
 * Get list of users
 * @param {Object} filters - Filter parameters
 * @param {String} filters.role - Filter by role
 * @param {String} filters.search - Search by email, firstName, lastName
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Object} - List of users and pagination info
 */
const getUsers = async (filters) => {
  const { role, search, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  const where = {};

  // Filter by role
  if (role) {
    where.role = role;
  }

  // Search by email, firstName, lastName
  if (search) {
    where[Sequelize.Op.or] = [
      { email: { [Sequelize.Op.like]: `%${search}%` } },
      { firstName: { [Sequelize.Op.like]: `%${search}%` } },
      { lastName: { [Sequelize.Op.like]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows } = await User.findAndCountAll({
      where,
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
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      users: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit, 10),
    };
  } catch (error) {
    logger.error(`Failed to get users: ${error.message}`);
    throw error;
  }
};

export { toggleUserStatus, getUsers };
