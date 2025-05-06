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
 *     summary: Реєстрація першого адміністратора
 *     description: Створює першого адміністратора в системі. Використовується при початковому налаштуванні.
 *     tags: [Адміністрування]
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
 *                 description: Email адміністратора
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль адміністратора
 *               firstName:
 *                 type: string
 *                 description: Ім'я адміністратора
 *               lastName:
 *                 type: string
 *                 description: Прізвище адміністратора
 *               phone:
 *                 type: string
 *                 description: Номер телефону адміністратора
 *     responses:
 *       201:
 *         description: Адміністратор успішно створений
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
 *                   description: JWT токен для авторизації
 *       400:
 *         description: Адміністратор вже існує
 *       422:
 *         description: Помилка валідації даних
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
