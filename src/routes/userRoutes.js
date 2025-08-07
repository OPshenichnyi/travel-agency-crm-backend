import express from "express";
import { body, query, param } from "express-validator";
import {
  toggleUserStatusController,
  getUsersController,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get user list
 *     description: Retrieves a list of all users. Only accessible by administrators.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, manager, agent]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, name, or surname
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
 *     responses:
 *       200:
 *         description: User list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   description: Total number of users
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
 *         description: Insufficient permissions to perform operation
 */
router.get(
  "/",
  [
    // Only administrator can view user list
    checkRole("admin"),

    // Validate request parameters
    query("role")
      .optional()
      .isIn(["admin", "manager", "agent"])
      .withMessage("Invalid role"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    validate,
  ],
  getUsersController
);

/**
 * @swagger
 * /users/{id}/toggle-status:
 *   patch:
 *     summary: Toggle user status
 *     description: Changes the user's activity status (blocks or unblocks). Only accessible by administrators.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New activity status
 *     responses:
 *       200:
 *         description: User status changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User activated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions to perform operation
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/toggle-status",
  [
    // Only administrator can change user status
    checkRole("admin"),

    // Validate parameters
    param("id").isUUID(4).withMessage("Invalid user ID format"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
    validate,
  ],
  toggleUserStatusController
);

export default router;
