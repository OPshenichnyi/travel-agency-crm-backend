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

// Всі маршрути потребують автентифікації
router.use(authenticate);

// Всі маршрути доступні тільки для менеджерів і адміністраторів
router.use(checkRole(["manager", "admin"]));

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Отримання списку агентів
 *     description: Отримує список агентів. Доступно для менеджерів (їхні агенти) та адміністраторів (всі агенти).
 *     tags: [Агенти]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Список агентів
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
 *                   description: Загальна кількість агентів
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
    // Валідація параметрів запиту
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
 *     summary: Оновлення даних агента
 *     description: Оновлює дані агента. Доступно для менеджерів та адміністраторів.
 *     tags: [Агенти]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID агента
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Ім'я агента
 *               lastName:
 *                 type: string
 *                 description: Прізвище агента
 *               phone:
 *                 type: string
 *                 description: Номер телефону агента
 *     responses:
 *       200:
 *         description: Дані агента успішно оновлено
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
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Агента не знайдено
 *       422:
 *         description: Помилка валідації даних
 */
router.put(
  "/:id",
  [
    // Валідація параметрів
    param("id").isUUID(4).withMessage("Invalid agent ID format"),

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
  updateAgentController
);

/**
 * @swagger
 * /agents/{id}/toggle-status:
 *   patch:
 *     summary: Активація/деактивація агента
 *     description: Змінює статус активності агента. Доступно для менеджерів та адміністраторів.
 *     tags: [Агенти]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID агента
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
 *         description: Статус агента змінено успішно
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
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Агента не знайдено
 */
router.patch(
  "/:id/toggle-status",
  [
    // Валідація параметрів
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
 *     summary: Отримання даних агента
 *     description: Отримує дані агента за його ID. Доступно для менеджерів та адміністраторів.
 *     tags: [Агенти]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID агента
 *     responses:
 *       200:
 *         description: Дані агента успішно отримано
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
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Агента не знайдено
 */
router.get(
  "/:id",
  [
    // Валідація параметрів
    param("id").isUUID(4).withMessage("Invalid agent ID format"),
    validate,
  ],
  getAgentByIdController
);

export default router;
