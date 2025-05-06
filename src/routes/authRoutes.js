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
 *     summary: Автентифікація користувача
 *     tags: [Автентифікація]
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
 *                 description: Email користувача
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль користувача
 *     responses:
 *       200:
 *         description: Успішна автентифікація
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT токен для авторизації
 *       401:
 *         description: Неправильний email або пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         description: Помилка валідації даних
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
 *     summary: Реєстрація користувача за запрошенням
 *     tags: [Автентифікація]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Токен запрошення
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
 *                 description: Пароль користувача
 *               firstName:
 *                 type: string
 *                 description: Ім'я користувача
 *               lastName:
 *                 type: string
 *                 description: Прізвище користувача
 *               phone:
 *                 type: string
 *                 description: Номер телефону користувача
 *     responses:
 *       201:
 *         description: Успішна реєстрація
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
 *                   description: JWT токен для авторизації
 *       400:
 *         description: Недійсний або прострочений токен
 *       422:
 *         description: Помилка валідації даних
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
