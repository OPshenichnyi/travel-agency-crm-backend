import express from "express";
import { body, query, param } from "express-validator";
import {
  createInvitationController,
  getInvitationsController,
  cancelInvitationController,
} from "../controllers/invitationController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /invitations:
 *   post:
 *     summary: Create an invitation for a new user
 *     description: Allows the administrator to create an invitation for a manager, or a manager to create an invitation for an agent
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email for the invitation
 *               role:
 *                 type: string
 *                 enum: [manager, agent]
 *                 description: Role for the invited user
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation created successfully
 *                 invitation:
 *                   $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient rights to perform the operation
 *       409:
 *         description: User with this email already exists or an active invitation already exists
 *       422:
 *         description: Data validation error
 */
router.post(
  "/",
  [
    // Validate data
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("role")
      .isIn(["manager", "agent"])
      .withMessage("Role must be either manager or agent"),

    // Check access rights:
    // Only administrator can invite managers
    // Administrators and managers can invite agents
    (req, res, next) => {
      const { role } = req.body;
      const userRole = req.user.role;

      if (role === "manager" && userRole !== "admin") {
        return res.status(403).json({
          error: {
            status: 403,
            message: "Only admin can invite managers",
          },
        });
      }

      if (role === "agent" && !["admin", "manager"].includes(userRole)) {
        return res.status(403).json({
          error: {
            status: 403,
            message: "Only admin or manager can invite agents",
          },
        });
      }

      next();
    },

    validate,
  ],
  createInvitationController
);

/**
 * @swagger
 * /invitations:
 *   get:
 *     summary: Get a list of invitations
 *     description: Gets a list of invitations. The administrator sees all invitations, managers only see those they created.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: invitedBy
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user who created the invitation (only for administrator)
 *     responses:
 *       200:
 *         description: List of invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Unique invitation identifier
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Email to which the invitation was sent
 *                       role:
 *                         type: string
 *                         enum: [manager, agent]
 *                         description: Role for the invited user
 *                       token:
 *                         type: string
 *                         description: Unique token for registration
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         description: Invitation expiration date
 *                       used:
 *                         type: boolean
 *                         description: Whether the invitation was used
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Invitation creation date
 *                       inviter:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           email:
 *                             type: string
 *                             format: email
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                 total:
 *                   type: integer
 *                   description: Total number of invitations
 *                 page:
 *                   type: integer
 *                   description: Current page
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient rights to perform the operation
 */
router.get(
  "/",
  [
    // Validate request parameters
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("invitedBy")
      .optional()
      .isUUID(4)
      .withMessage("Invalid invitedBy ID format"),
    validate,
  ],
  getInvitationsController
);

/**
 * @swagger
 * /invitations/{id}:
 *   delete:
 *     summary: Cancel an invitation
 *     description: Cancels an invitation. The administrator can cancel any invitation, managers only see those they created.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation cancelled successfully
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the cancelled invitation
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient rights to perform the operation
 *       404:
 *         description: Invitation not found
 */
router.delete(
  "/:id",
  [
    // Validate parameters
    param("id").isUUID(4).withMessage("Invalid invitation ID format"),
    validate,
  ],
  cancelInvitationController
);

export default router;
