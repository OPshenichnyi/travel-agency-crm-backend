import express from "express";
import { body } from "express-validator";
import {
  loginController,
  registerController,
} from "../controllers/authController.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authorization
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         description: Data validation error
 */
// Login route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  loginController
);

// Register route
/**
 * @swagger
 * /auth/register/{token}:
 *   post:
 *     summary: User registration by invitation
 *     description: Registers a new user by invitation. If an agent registers through an invitation from a manager, the agent is automatically assigned to that manager.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *               firstName:
 *                 type: string
 *                 description: User first name
 *               lastName:
 *                 type: string
 *                 description: User last name
 *               phone:
 *                 type: string
 *                 description: User phone number
 *     responses:
 *       201:
 *         description: Successful registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authorization
 *       400:
 *         description: Invalid or expired token
 *       422:
 *         description: Data validation error
 */
router.post(
  "/register/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("phone")
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage("Please provide a valid phone number"),
    validate,
  ],
  registerController
);

export default router;
