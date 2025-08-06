import express from "express";
import { body, query, param } from "express-validator";
import {
  createOrderController,
  getOrderByIdController,
  updateOrderController,
  getOrdersController,
} from "../controllers/orderController.js";
import { generateVoucherController } from "../controllers/voucherController.js";
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
 *               - checkIn
 *               - checkOut
 *               - nights
 *               - countryTravel
 *               - cityTravel
 *               - propertyName
 *               - propertyNumber
 *               - reservationNumber
 *               - clientName
 *               - clientPhone
 *               - clientCountry
 *               - guests
 *               - officialPrice
 *             properties:
 *               agentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID агента (для менеджерів та адміністраторів)
 *               agentName:
 *                 type: string
 *                 description: Ім'я агента
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
 *               countryTravel:
 *                 type: string
 *                 description: Країна подорожі
 *               cityTravel:
 *                 type: string
 *                 description: Місто подорожі
 *               propertyName:
 *                 type: string
 *                 description: Назва об'єкта розміщення
 *               propertyNumber:
 *                 type: string
 *                 description: Номер об'єкта розміщення
 *               reservationNumber:
 *                 type: string
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
 *               clientCountry:
 *                 type: string
 *                 description: Країна клієнта
 *               clientDocumentNumber:
 *                 type: string
 *                 description: Номер паспорта або іншого документа клієнта
 *               guests:
 *                 type: object
 *                 description: Інформація про гостей
 *               officialPrice:
 *                 type: number
 *                 description: Офіційна ціна
 *               taxClean:
 *                 type: number
 *                 description: Податок на прибирання
 *               discount:
 *                 type: number
 *                 description: Знижка
 *               totalPrice:
 *                 type: number
 *                 description: Загальна ціна
 *               bankAccount:
 *                 type: string
 *                 description: Банківський рахунок для оплати
 *               depositAmount:
 *                 type: number
 *                 description: Сума депозиту
 *               depositStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Статус оплати депозиту
 *               depositDueDate:
 *                 type: string
 *                 format: date
 *                 description: Дата оплати депозиту
 *               depositPaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Методи оплати депозиту
 *               balanceAmount:
 *                 type: number
 *                 description: Сума балансу
 *               balanceStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Статус оплати балансу
 *               balanceDueDate:
 *                 type: string
 *                 format: date
 *                 description: Дата оплати балансу
 *               balancePaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Методи оплати балансу
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
    body("checkIn").isDate().withMessage("Valid check-in date is required"),
    body("checkOut").isDate().withMessage("Valid check-out date is required"),
    body("nights")
      .isInt({ min: 1 })
      .withMessage("Valid number of nights is required"),
    body("countryTravel").notEmpty().withMessage("Country travel is required"),
    body("cityTravel").notEmpty().withMessage("City travel is required"),
    body("propertyName").notEmpty().withMessage("Property name is required"),
    body("propertyNumber")
      .notEmpty()
      .withMessage("Property number is required"),
    body("reservationNumber")
      .notEmpty()
      .withMessage("Reservation number is required"),
    body("clientName").notEmpty().withMessage("Client name is required"),
    body("clientPhone")
      .isArray()
      .withMessage("Client phone numbers must be an array"),
    body("clientCountry").notEmpty().withMessage("Client country is required"),
    body("clientEmail")
      .optional()
      .custom((value) => {
        // Allow null, empty string, or valid email
        if (value === null || value === "") {
          return true;
        }
        // If value is provided, it must be a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Valid client email is required if provided");
        }
        return true;
      })
      .withMessage("Valid client email is required if provided"),
    body("clientDocumentNumber")
      .optional()
      .isString()
      .withMessage("Client document number must be a string if provided"),
    body("guests").isObject().withMessage("Guests information is required"),
    body("officialPrice")
      .isFloat({ min: 0 })
      .withMessage("Valid official price is required"),
    body("taxClean")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid tax/clean fee is required if provided"),
    body("discount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid discount is required if provided"),
    body("bankAccount")
      .optional()
      .isString()
      .withMessage("Bank account must be a string"),
    body("depositAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Deposit amount must be a positive number if provided"),
    body("depositStatus")
      .optional()
      .isIn(["unpaid", "paid"])
      .withMessage("Deposit status must be one of: unpaid, paid"),
    body("depositDueDate")
      .optional()
      .isDate()
      .withMessage("Deposit due date must be a valid date if provided"),
    body("depositPaymentMethods")
      .optional()
      .isArray()
      .withMessage("Deposit payment methods must be an array if provided"),
    body("balanceAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Balance amount must be a positive number if provided"),
    body("balanceStatus")
      .optional()
      .isIn(["unpaid", "paid"])
      .withMessage("Balance status must be one of: unpaid, paid"),
    body("balanceDueDate")
      .optional()
      .isDate()
      .withMessage("Balance due date must be a valid date if provided"),
    body("balancePaymentMethods")
      .optional()
      .isArray()
      .withMessage("Balance payment methods must be an array if provided"),

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
 *           enum: [pending, approved, rejected]
 *         description: Фільтр за статусом замовлення
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук за ім'ям клієнта, країною/містом подорожі або email
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
      .isIn(["pending", "approved", "rejected"])
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
 *     description: Оновлює дані замовлення. Адміністратори можуть оновлювати всі замовлення, менеджери - тільки замовлення своїх агентів, агенти - тільки свої замовлення і не можуть змінювати статуси замовлення та оплат. Агенти можуть редагувати суми депозиту та балансу тільки до того, як менеджер встановить відповідний статус оплати як "paid". При зміні статусу оплати на "paid" автоматично встановлюється дата оплати.
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
 *               countryTravel:
 *                 type: string
 *                 description: Країна подорожі
 *               cityTravel:
 *                 type: string
 *                 description: Місто подорожі
 *               propertyName:
 *                 type: string
 *                 description: Назва об'єкта розміщення
 *               propertyNumber:
 *                 type: string
 *                 description: Номер об'єкта розміщення
 *               reservationNumber:
 *                 type: string
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
 *               clientCountry:
 *                 type: string
 *                 description: Країна клієнта
 *               clientDocumentNumber:
 *                 type: string
 *                 description: Номер паспорта або іншого документа клієнта
 *               guests:
 *                 type: object
 *                 description: Інформація про гостей
 *               officialPrice:
 *                 type: number
 *                 description: Офіційна ціна
 *               taxClean:
 *                 type: number
 *                 description: Податок на прибирання
 *               discount:
 *                 type: number
 *                 description: Знижка
 *               totalPrice:
 *                 type: number
 *                 description: Загальна ціна
 *               bankAccount:
 *                 type: string
 *                 description: Банківський рахунок для оплати
 *               depositAmount:
 *                 type: number
 *                 description: Сума депозиту
 *               depositStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Статус оплати депозиту
 *               depositDueDate:
 *                 type: string
 *                 format: date
 *                 description: Дата оплати депозиту
 *               depositPaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Методи оплати депозиту
 *               balanceAmount:
 *                 type: number
 *                 description: Сума балансу
 *               balanceStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Статус оплати балансу
 *               balanceDueDate:
 *                 type: string
 *                 format: date
 *                 description: Дата оплати балансу
 *               balancePaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Методи оплати балансу
 *               statusOrder:
 *                 type: string
 *                 enum: [pending, approved, rejected]
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
    body("countryTravel")
      .optional()
      .notEmpty()
      .withMessage("Country travel cannot be empty if provided"),
    body("cityTravel")
      .optional()
      .notEmpty()
      .withMessage("City travel cannot be empty if provided"),
    body("propertyName")
      .optional()
      .notEmpty()
      .withMessage("Property name cannot be empty if provided"),
    body("propertyNumber")
      .optional()
      .notEmpty()
      .withMessage("Property number cannot be empty if provided"),
    body("reservationNumber")
      .optional()
      .notEmpty()
      .withMessage("Reservation number cannot be empty if provided"),
    body("clientName")
      .optional()
      .notEmpty()
      .withMessage("Client name cannot be empty if provided"),
    body("clientPhone")
      .optional()
      .isArray()
      .withMessage("Client phone numbers must be an array if provided"),
    body("clientCountry")
      .optional()
      .notEmpty()
      .withMessage("Client country cannot be empty if provided"),
    body("clientEmail")
      .optional()
      .custom((value) => {
        // Allow null, empty string, or valid email
        if (value === null || value === "") {
          return true;
        }
        // If value is provided, it must be a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Valid client email is required if provided");
        }
        return true;
      })
      .withMessage("Valid client email is required if provided"),
    body("clientDocumentNumber")
      .optional()
      .isString()
      .withMessage("Client document number must be a string if provided"),
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
    body("discount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid discount is required if provided"),
    body("totalPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid total price is required if provided"),
    body("bankAccount")
      .optional()
      .isString()
      .withMessage("Bank account must be a string if provided"),
    body("depositAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Deposit amount must be a positive number if provided"),
    body("depositStatus")
      .optional()
      .isIn(["unpaid", "paid"])
      .withMessage("Deposit status must be one of: unpaid, paid"),
    body("depositDueDate")
      .optional()
      .isDate()
      .withMessage("Deposit due date must be a valid date if provided"),
    body("depositPaymentMethods")
      .optional()
      .isArray()
      .withMessage("Deposit payment methods must be an array if provided"),
    body("balanceAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Balance amount must be a positive number if provided"),
    body("balanceStatus")
      .optional()
      .isIn(["unpaid", "paid"])
      .withMessage("Balance status must be one of: unpaid, paid"),
    body("balanceDueDate")
      .optional()
      .isDate()
      .withMessage("Balance due date must be a valid date if provided"),
    body("balancePaymentMethods")
      .optional()
      .isArray()
      .withMessage("Balance payment methods must be an array if provided"),
    body("statusOrder")
      .optional()
      .isIn(["pending", "approved", "rejected"])
      .withMessage("Status must be one of: pending, approved, rejected")
      .custom((value, { req }) => {
        // Only admin and manager can change order status
        if (req.user.role === "agent") {
          throw new Error("Agents cannot change order status");
        }
        return true;
      }),

    // Custom validator for payment statuses
    body("depositStatus")
      .optional()
      .custom((value, { req }) => {
        // Only admin and manager can change payment status
        if (req.user.role === "agent") {
          throw new Error("Agents cannot change payment status");
        }
        return true;
      }),
    body("balanceStatus")
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

/**
 * @swagger
 * /orders/{orderId}/voucher:
 *   get:
 *     summary: Генерація PDF ваучера
 *     description: Генерує PDF ваучер для замовлення. Доступно тільки для затверджених замовлень.
 *     tags: [Замовлення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID замовлення
 *     responses:
 *       200:
 *         description: PDF ваучер успішно згенерований
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Немає дозволу або статус не "approved"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Замовлення не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Помилка генерації PDF
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get(
  "/:orderId/voucher",
  [
    param("orderId").isUUID().withMessage("Valid order ID is required"),
    validate,
  ],
  generateVoucherController
);

export default router;
