import express from "express";
import { query, param } from "express-validator";
import {
  getManagerOrdersController,
  confirmOrderController,
  confirmPaymentController,
} from "../controllers/managerOrderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only managers and admins can access these routes
router.use(checkRole(["manager", "admin"]));

/**
 * @swagger
 * /manager/orders:
 *   get:
 *     summary: Отримання списку замовлень для менеджера
 *     description: Отримує список замовлень для агентів, якими керує менеджер.
 *     tags: [Менеджер - Замовлення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, confirmed, paid]
 *         description: Фільтр за статусом замовлення
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Фільтр за ID агента
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук за ім'ям клієнта, назвою об'єкта або місцем розташування
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
 *         description: Список замовлень
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                   description: Загальна кількість замовлень
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
    // Validation
    query("status")
      .optional()
      .isIn(["draft", "confirmed", "paid"])
      .withMessage("Invalid status value"),
    query("agentId")
      .optional()
      .isUUID(4)
      .withMessage("Invalid agent ID format"),
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
  getManagerOrdersController
);

/**
 * @swagger
 * /manager/orders/{id}/confirm:
 *   patch:
 *     summary: Підтвердження замовлення
 *     description: Підтверджує замовлення та генерує PDF-рахунок. Доступно тільки для замовлень агентів, якими керує менеджер.
 *     tags: [Менеджер - Замовлення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID замовлення
 *     responses:
 *       200:
 *         description: Замовлення успішно підтверджено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order confirmed successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції або замовлення вже підтверджено
 *       404:
 *         description: Замовлення не знайдено
 */
router.patch(
  "/:id/confirm",
  [param("id").isUUID(4).withMessage("Invalid order ID format"), validate],
  confirmOrderController
);

/**
 * @swagger
 * /manager/orders/{id}/confirm-payment:
 *   patch:
 *     summary: Підтвердження оплати замовлення
 *     description: Підтверджує оплату замовлення та генерує PDF-ваучер. Доступно тільки для замовлень агентів, якими керує менеджер.
 *     tags: [Менеджер - Замовлення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID замовлення
 *     responses:
 *       200:
 *         description: Оплата успішно підтверджена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment confirmed successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції або замовлення вже оплачено
 *       404:
 *         description: Замовлення не знайдено
 */
router.patch(
  "/:id/confirm-payment",
  [param("id").isUUID(4).withMessage("Invalid order ID format"), validate],
  confirmPaymentController
);

export default router;
