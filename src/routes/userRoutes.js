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

// Всі маршрути потребують автентифікації
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Отримання списку користувачів
 *     description: Отримує список всіх користувачів. Доступно тільки для адміністраторів.
 *     tags: [Користувачі]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, manager, agent]
 *         description: Фільтр за роллю
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук за email, ім'ям, прізвищем
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер сторінки
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Кількість елементів на сторінці
 *     responses:
 *       200:
 *         description: Список користувачів
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
 *                   description: Загальна кількість користувачів
 *                 page:
 *                   type: integer
 *                   description: Поточна сторінка
 *                 totalPages:
 *                   type: integer
 *                   description: Загальна кількість сторінок
 *                 limit:
 *                   type: integer
 *                   description: Кількість елементів на сторінці
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 */
router.get(
  "/",
  [
    // Тільки адміністратор може переглядати список користувачів
    checkRole("admin"),

    // Валідація параметрів запиту
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
 *     summary: Блокування/розблокування користувача
 *     description: Змінює статус активності користувача (блокує або розблоковує). Доступно тільки для адміністраторів.
 *     tags: [Користувачі]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID користувача
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
 *                 description: Новий статус активності
 *     responses:
 *       200:
 *         description: Статус користувача змінено успішно
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
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Користувача не знайдено
 */
router.patch(
  "/:id/toggle-status",
  [
    // Тільки адміністратор може змінювати статус користувача
    checkRole("admin"),

    // Валідація параметрів
    param("id").isUUID(4).withMessage("Invalid user ID format"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
    validate,
  ],
  toggleUserStatusController
);

export default router;
