import express from "express";
import { body } from "express-validator";
import {
  getUserProfileController,
  updateUserProfileController,
  changePasswordController,
} from "../controllers/profileController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Всі маршрути потребують автентифікації
router.use(authenticate);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Отримання профілю користувача
 *     description: Отримує профіль поточного автентифікованого користувача
 *     tags: [Профіль]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профіль користувача
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Необхідна автентифікація
 *       404:
 *         description: Користувача не знайдено
 */
router.get("/", getUserProfileController);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Оновлення профілю користувача
 *     description: Оновлює дані профілю поточного автентифікованого користувача
 *     tags: [Профіль]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *       200:
 *         description: Профіль успішно оновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Необхідна автентифікація
 *       422:
 *         description: Помилка валідації даних
 */
router.put(
  "/",
  [
    // Валідація даних
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
  updateUserProfileController
);

/**
 * @swagger
 * /profile/change-password:
 *   put:
 *     summary: Зміна паролю користувача
 *     description: Змінює пароль поточного автентифікованого користувача
 *     tags: [Профіль]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Поточний пароль
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Новий пароль
 *     responses:
 *       200:
 *         description: Пароль успішно змінено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Поточний пароль неправильний
 *       401:
 *         description: Необхідна автентифікація
 *       422:
 *         description: Помилка валідації даних
 */
router.put(
  "/change-password",
  [
    // Валідація даних
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long"),
    validate,
  ],
  changePasswordController
);

export default router;
