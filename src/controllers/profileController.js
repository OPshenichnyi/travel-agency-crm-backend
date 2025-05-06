import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../services/profileService.js";

/**
 * Get user profile controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserProfileController = async (req, res, next) => {
  try {
    // Get profile of the authenticated user
    const profile = await getUserProfile(req.user.id);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUserProfileController = async (req, res, next) => {
  try {
    const profileData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
    };

    const updatedProfile = await updateUserProfile(req.user.id, profileData);

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const changePasswordController = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getUserProfileController,
  updateUserProfileController,
  changePasswordController,
};
