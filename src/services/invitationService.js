import { User, Invitation } from "../models/index.js";
import { Sequelize } from "sequelize";
import { sendInvitation } from "./emailService.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

/**
 * Create invitation for a new user
 * @param {Object} data - Invitation data
 * @param {String} data.email - Email to send invitation to
 * @param {String} data.role - Role for the new user (manager/agent)
 * @param {String} data.invitedBy - ID of the user who creates invitation
 * @returns {Object} - Created invitation
 */

const createInvitation = async (data) => {
  const { email, role, invitedBy } = data;

  // Check if user with this email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.status = 409;
    throw error;
  }

  // Check if active invitation for this email already exists
  const existingInvitation = await Invitation.findOne({
    where: {
      email,
      used: false,
      expiresAt: {
        [Sequelize.Op.gt]: new Date(), // not expired
      },
    },
  });

  if (existingInvitation) {
    const error = new Error("Active invitation for this email already exists");
    error.status = 409;
    throw error;
  }

  try {
    // Get inviter data for email
    const inviter = await User.findByPk(invitedBy);
    if (!inviter) {
      const error = new Error("Inviter not found");
      error.status = 404;
      throw error;
    }

    // Create invitation
    const invitation = await Invitation.create({
      id: uuidv4(),
      email,
      role,
      invitedBy,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false,
    });

    // Send email with invitation
    try {
      const inviterName = inviter.firstName
        ? `${inviter.firstName} ${inviter.lastName || ""}`
        : inviter.email;

      await sendInvitation(email, role, invitation.token, inviterName);
      logger.info(`Invitation email sent to ${email} for role ${role}`);
    } catch (emailError) {
      logger.error(`Failed to send invitation email: ${emailError.message}`);
      // We still create invitation even if email sending failed
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    };
  } catch (error) {
    logger.error(`Failed to create invitation: ${error.message}`);
    throw error;
  }
};

/**
 * Get list of invitations
 * @param {Object} filters - Filter parameters
 * @param {String} filters.invitedBy - ID of the user who created invitations
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Object} - List of invitations and pagination info
 */
const getInvitations = async (filters) => {
  const { invitedBy, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  const where = {};
  if (invitedBy) {
    where.invitedBy = invitedBy;
  }

  try {
    const { count, rows } = await Invitation.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "inviter",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      attributes: [
        "id",
        "email",
        "role",
        "token",
        "expiresAt",
        "used",
        "createdAt",
      ],
    });

    return {
      invitations: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit, 10),
    };
  } catch (error) {
    logger.error(`Failed to get invitations: ${error.message}`);
    throw error;
  }
};

/**
 * Cancel invitation
 * @param {String} id - Invitation ID
 * @param {String} userId - ID of the user cancelling the invitation
 * @returns {Object} - Cancelled invitation
 */
const cancelInvitation = async (id, userId) => {
  try {
    const invitation = await Invitation.findByPk(id);

    if (!invitation) {
      const error = new Error("Invitation not found");
      error.status = 404;
      throw error;
    }

    // Only inviter or admin can cancel invitation
    const user = await User.findByPk(userId);
    if (invitation.invitedBy !== userId && user.role !== "admin") {
      const error = new Error(
        "You are not authorized to cancel this invitation"
      );
      error.status = 403;
      throw error;
    }

    // Check if invitation is already used
    if (invitation.used) {
      const error = new Error("Cannot cancel used invitation");
      error.status = 400;
      throw error;
    }

    // Completely delete invitation instead of setting expiration date
    await invitation.destroy();

    return { id: invitation.id };
  } catch (error) {
    logger.error(`Failed to cancel invitation: ${error.message}`);
    throw error;
  }
};

export { createInvitation, getInvitations, cancelInvitation };
