import express from "express";
import { body, query, param } from "express-validator";
import {
  getAgentsController,
  updateAgentController,
  toggleAgentStatusController,
  getAgentByIdController,
} from "../controllers/agentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All routes available only for managers and administrators
router.use(checkRole(["manager", "admin"]));

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Get list of agents
 *     description: Gets a list of agents. For managers, it shows only their agents, for administrators - all agents.
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, name, or last name
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
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   description: Total number of agents
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
    validate,
  ],
  getAgentsController
);

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     summary: Update agent data
 *     description: Updates agent data. Managers can only edit their agents. Administrators can edit all agents.
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Agent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Agent's first name
 *               lastName:
 *                 type: string
 *                 description: Agent's last name
 *               phone:
 *                 type: string
 *                 description: Agent's phone number
 *     responses:
 *       200:
 *         description: Agent data successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Agent updated successfully
 *                 agent:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient rights to perform the operation
 *       404:
 *         description: Agent not found
 *       422:
 *         description: Data validation error
 */
router.put(
  "/:id",
  [
    // Validate parameters
    param("id").isUUID(4).withMessage("Invalid agent ID format"),

    // Validate data
    body("firstName")
      .optional()
      .notEmpty()
      .withMessage("First name cannot be empty if provided"),
    body("lastName")
      .optional()
      .notEmpty()
      .withMessage("Last name cannot be empty if provided"),
    body("phone")
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage("Please provide a valid phone number"),
    validate,
  ],
  updateAgentController
);

/**
 * @swagger
 * /agents/{id}/toggle-status:
 *   patch:
 *     summary: Activate/deactivate agent
 *     description: Changes the agent's activity status. Managers can change the status only for their agents. Administrators can change the status for all agents.
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Agent ID
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
 *         description: Agent status changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Agent activated successfully
 *                 agent:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient rights to perform the operation
 *       404:
 *         description: Agent not found
 */
router.patch(
  "/:id/toggle-status",
  [
    // Validate parameters
    param("id").isUUID(4).withMessage("Invalid agent ID format"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
    validate,
  ],
  toggleAgentStatusController
);

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get agent data
 *     description: Gets agent data by its ID. Managers can see only their agents. Administrators can see all agents.
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent data successfully fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Agent fetched successfully
 *                 agent:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient rights to perform the operation
 *       404:
 *         description: Agent not found
 */
router.get(
  "/:id",
  [
    // Validate parameters
    param("id").isUUID(4).withMessage("Invalid agent ID format"),
    validate,
  ],
  getAgentByIdController
);

export default router;
