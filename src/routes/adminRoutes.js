import express from "express";
import { body } from "express-validator";
import { registerFirstAdminController } from "../controllers/adminController.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Register first admin route (should be secured in production)
/**
 * @swagger
 * /admin/register-first-admin:
 *   post:
 *     summary: Register first administrator
 *     description: Creates the first administrator in the system. Used during initial setup.
 *     tags: [Administration]
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
 *                 description: Administrator email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Administrator password
 *               firstName:
 *                 type: string
 *                 description: Administrator first name
 *               lastName:
 *                 type: string
 *                 description: Administrator last name
 *               phone:
 *                 type: string
 *                 description: Administrator phone number
 *     responses:
 *       201:
 *         description: Administrator created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin user created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authorization
 *       400:
 *         description: Administrator already exists
 *       422:
 *         description: Data validation error
 */
router.post(
  "/register-first-admin",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
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
  registerFirstAdminController
);

export default router;
