import { toggleUserStatus, getUsers } from "../services/userService.js";

/**
 * Toggle user status controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const toggleUserStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await toggleUserStatus(id, isActive);

    res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUsersController = async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await getUsers(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export { toggleUserStatusController, getUsersController };
