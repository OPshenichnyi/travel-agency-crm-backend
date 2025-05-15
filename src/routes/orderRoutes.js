import express from "express";
import { body, query, param } from "express-validator";
import {
  createOrderController,
  getOrderByIdController,
  updateOrderController,
  getOrdersController,
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { Sequelize } from "sequelize";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Створення нового замовлення
 *     description: Створює нове замовлення. Агенти можуть створювати замовлення тільки від свого імені.
 *     tags: [Замовлення]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentName
 *               - agentCountry
 *               - checkIn
 *               - checkOut
 *               - nights
 *               - locationTravel
 *               - reservationNumber
 *               - clientName
 *               - clientPhone
 *               - guests
 *               - officialPrice
 *               - payments
 *             properties:
 *               agentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID агента (для менеджерів та адміністраторів)
 *               agentName:
 *                 type: string
 *                 description: Ім'я агента
 *               agentCountry:
 *                 type: string
 *                 description: Країна агента
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 description: Дата заїзду
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 description: Дата виїзду
 *               nights:
 *                 type: integer
 *                 description: Кількість ночей
 *               locationTravel:
 *                 type: string
 *                 description: Місце подорожі
 *               reservationNumber:
 *                 type: integer
 *                 description: Номер бронювання
 *               clientName:
 *                 type: string
 *                 description: Ім'я клієнта
 *               clientPhone:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Номери телефонів клієнта
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 description: Email клієнта
 *               guests:
 *                 type: object
 *                 description: Інформація про гостей
 *               officialPrice:
 *                 type: number
 *                 description: Офіційна ціна
 *               taxClean:
 *                 type: number
 *                 description: Податок на прибирання
 *               totalPrice:
 *                 type: number
 *                 description: Загальна ціна
 *               bankAccount:
 *                 type: string
 *                 description: Банківський рахунок для оплати
 *               payments:
 *                 type: object
 *                 description: Інформація про оплати
 *     responses:
 *       201:
 *         description: Замовлення успішно створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 order:
 *                   type: object
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       422:
 *         description: Помилка валідації даних
 */
router.post(
  "/",
  [
    // Body validation for required fields
    body("agentName").notEmpty().withMessage("Agent name is required"),
    body("agentCountry").notEmpty().withMessage("Agent country is required"),
    body("checkIn").isDate().withMessage("Valid check-in date is required"),
    body("checkOut").isDate().withMessage("Valid check-out date is required"),
    body("nights")
      .isInt({ min: 1 })
      .withMessage("Valid number of nights is required"),
    body("locationTravel").notEmpty().withMessage("Location is required"),
    body("reservationNumber")
      .isInt({ min: 1 })
      .withMessage("Valid reservation number is required"),
    body("clientName").notEmpty().withMessage("Client name is required"),
    body("clientPhone")
      .isArray()
      .withMessage("Client phone numbers must be an array"),
    body("clientEmail")
      .optional()
      .isEmail()
      .withMessage("Valid client email is required if provided"),
    body("guests").isObject().withMessage("Guests information is required"),
    body("officialPrice")
      .isFloat({ min: 0 })
      .withMessage("Valid official price is required"),
    body("taxClean")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid tax/clean fee is required if provided"),
    body("bankAccount")
      .optional()
      .isString()
      .withMessage("Bank account must be a string"),
    body("payments").isObject().withMessage("Payments information is required"),

    // Check if admin/manager is creating an order for an agent
    (req, res, next) => {
      // If agentId is provided and user is not an admin or manager, throw error
      if (req.body.agentId && !["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({
          error: {
            status: 403,
            message: "Only admin or manager can create orders for agents",
          },
        });
      }
      next();
    },

    validate,
  ],
  createOrderController
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Отримання списку замовлень
 *     description: Отримує список замовлень. Адміністратори бачать всі замовлення, менеджери - тільки замовлення своїх агентів, агенти - тільки свої замовлення.
 *     tags: [Замовлення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aprove, unpaid, paid]
 *         description: Фільтр за статусом замовлення
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук за ім'ям клієнта, локацією або email
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
 *                     type: object
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
 */
router.get(
  "/",
  [
    // Query validation
    query("status")
      .optional()
      .isIn(["aprove", "unpaid", "paid"])
      .withMessage("Invalid status"),
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
  getOrdersController
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Отримання замовлення за ID
 *     description: Отримує дані замовлення за його ID. Адміністратори бачать всі замовлення, менеджери - тільки замовлення своїх агентів, агенти - тільки свої замовлення.
 *     tags: [Замовлення]
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
 *         description: Замовлення успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order fetched successfully
 *                 order:
 *                   type: object
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Замовлення не знайдено
 */
router.get(
  "/:id",
  [param("id").isUUID(4).withMessage("Invalid order ID format"), validate],
  getOrderByIdController
);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Оновлення замовлення
 *     description: Оновлює дані замовлення. Адміністратори можуть оновлювати всі замовлення, менеджери - тільки замовлення своїх агентів, агенти - тільки свої замовлення і не можуть змінювати статуси.
 *     tags: [Замовлення]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentName:
 *                 type: string
 *                 description: Ім'я агента
 *               agentCountry:
 *                 type: string
 *                 description: Країна агента
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 description: Дата заїзду
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 description: Дата виїзду
 *               nights:
 *                 type: integer
 *                 description: Кількість ночей
 *               locationTravel:
 *                 type: string
 *                 description: Місце подорожі
 *               reservationNumber:
 *                 type: integer
 *                 description: Номер бронювання
 *               clientName:
 *                 type: string
 *                 description: Ім'я клієнта
 *               clientPhone:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Номери телефонів клієнта
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 description: Email клієнта
 *               guests:
 *                 type: object
 *                 description: Інформація про гостей
 *               officialPrice:
 *                 type: number
 *                 description: Офіційна ціна
 *               taxClean:
 *                 type: number
 *                 description: Податок на прибирання
 *               totalPrice:
 *                 type: number
 *                 description: Загальна ціна
 *               bankAccount:
 *                 type: string
 *                 description: Банківський рахунок для оплати
 *               payments:
 *                 type: object
 *                 description: Інформація про оплати
 *               statusOrder:
 *                 type: string
 *                 enum: [aprove, unpaid, paid]
 *                 description: Статус замовлення (тільки для адміністраторів і менеджерів)
 *     responses:
 *       200:
 *         description: Замовлення успішно оновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order updated successfully
 *                 order:
 *                   type: object
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Замовлення не знайдено
 *       422:
 *         description: Помилка валідації даних
 */
router.put(
  "/:id",
  [
    param("id").isUUID(4).withMessage("Invalid order ID format"),

    // Validate optional fields for update
    body("agentName")
      .optional()
      .notEmpty()
      .withMessage("Agent name cannot be empty if provided"),
    body("agentCountry")
      .optional()
      .notEmpty()
      .withMessage("Agent country cannot be empty if provided"),
    body("checkIn")
      .optional()
      .isDate()
      .withMessage("Valid check-in date is required if provided"),
    body("checkOut")
      .optional()
      .isDate()
      .withMessage("Valid check-out date is required if provided"),
    body("nights")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid number of nights is required if provided"),
    body("locationTravel")
      .optional()
      .notEmpty()
      .withMessage("Location cannot be empty if provided"),
    body("reservationNumber")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid reservation number is required if provided"),
    body("clientName")
      .optional()
      .notEmpty()
      .withMessage("Client name cannot be empty if provided"),
    body("clientPhone")
      .optional()
      .isArray()
      .withMessage("Client phone numbers must be an array if provided"),
    body("clientEmail")
      .optional()
      .isEmail()
      .withMessage("Valid client email is required if provided"),
    body("guests")
      .optional()
      .isObject()
      .withMessage("Guests information must be an object if provided"),
    body("officialPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid official price is required if provided"),
    body("taxClean")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid tax/clean fee is required if provided"),
    body("totalPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid total price is required if provided"),
    body("bankAccount")
      .optional()
      .isString()
      .withMessage("Bank account must be a string if provided"),
    body("payments")
      .optional()
      .isObject()
      .withMessage("Payments information must be an object if provided"),
    body("statusOrder")
      .optional()
      .isIn(["aprove", "unpaid", "paid"])
      .withMessage("Status must be one of: aprove, unpaid, paid")
      .custom((value, { req }) => {
        // Only admin and manager can change order status
        if (req.user.role === "agent") {
          throw new Error("Agents cannot change order status");
        }
        return true;
      }),

    // Custom validator for payment status
    body("payments.*.status")
      .optional()
      .custom((value, { req }) => {
        // Only admin and manager can change payment status
        if (req.user.role === "agent") {
          throw new Error("Agents cannot change payment status");
        }
        return true;
      }),

    validate,
  ],
  updateOrderController
);

export default router;
