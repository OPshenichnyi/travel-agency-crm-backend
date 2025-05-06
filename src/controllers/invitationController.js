import {
  createInvitation,
  getInvitations,
  cancelInvitation,
} from "../services/invitationService.js";

/**
 * Create invitation controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createInvitationController = async (req, res, next) => {
  try {
    const invitationData = {
      email: req.body.email,
      role: req.body.role,
      invitedBy: req.user.id, // From auth middleware
    };

    const invitation = await createInvitation(invitationData);

    res.status(201).json({
      message: "Invitation created successfully",
      invitation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invitations controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getInvitationsController = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
    };

    // If user is not admin, only show their invitations
    if (req.user.role !== "admin") {
      filters.invitedBy = req.user.id;
    } else if (req.query.invitedBy) {
      // Admin can filter by inviter
      filters.invitedBy = req.query.invitedBy;
    }

    const result = await getInvitations(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel invitation controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const cancelInvitationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await cancelInvitation(id, req.user.id);

    res.status(200).json({
      message: "Invitation cancelled successfully",
      id: result.id,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createInvitationController,
  getInvitationsController,
  cancelInvitationController,
};
