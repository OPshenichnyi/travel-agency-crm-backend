import express from "express";
import { body, query, param } from "express-validator";
import {
  createOrderController,
  updateOrderController,
  deleteOrderController,
  markDepositPaidController,
  getAgentOrdersController,
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Agent can create, update, delete orders and mark deposit as paid
// Only agents can access these routes
router.use(checkRole("agent"));

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Отримання списку замовлень агента
 *     description: Отримує список замовлень, створених поточним агентом.
 *     tags: [Замовлення]
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
  getAgentOrdersController
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Створення нового замовлення
 *     description: Створює нове замовлення для авторизованого агента.
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
 *               - checkIn
 *               - checkOut
 *               - nights
 *               - propertyName
 *               - location
 *               - reservationNo
 *               - reservationCode
 *               - country
 *               - clientName
 *               - clientIdNo
 *               - guests
 *               - clientPhone
 *               - officialPrice
 *               - tax
 *               - totalPrice
 *               - depositBank
 *               - cashOnCheckIn
 *               - damageDeposit
 *             properties:
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
 *               propertyName:
 *                 type: string
 *                 description: Назва об'єкта розміщення
 *               location:
 *                 type: string
 *                 description: Місце розташування
 *               reservationNo:
 *                 type: integer
 *                 description: Номер бронювання
 *               reservationCode:
 *                 type: string
 *                 description: Код бронювання
 *               country:
 *                 type: string
 *                 description: Країна
 *               clientName:
 *                 type: string
 *                 description: Ім'я клієнта
 *               clientIdNo:
 *                 type: string
 *                 description: Номер ID клієнта
 *               guests:
 *                 type: string
 *                 description: Інформація про гостей
 *               clientPhone:
 *                 type: string
 *                 description: Телефон клієнта
 *               officialPrice:
 *                 type: number
 *                 description: Офіційна ціна
 *               tax:
 *                 type: number
 *                 description: Податок
 *               totalPrice:
 *                 type: number
 *                 description: Загальна ціна
 *               depositBank:
 *                 type: number
 *                 description: Сума депозиту до сплати через банк
 *               cashOnCheckIn:
 *                 type: number
 *                 description: Сума до сплати при заїзді
 *               damageDeposit:
 *                 type: string
 *                 enum: [yes, no]
 *                 description: Наявність депозиту за пошкодження
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
 *                   $ref: '#/components/schemas/Order'
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
    // Validation
    body("checkIn").isISO8601().withMessage("Invalid check-in date format"),
    body("checkOut").isISO8601().withMessage("Invalid check-out date format"),
    body("nights")
      .isInt({ min: 1 })
      .withMessage("Nights must be a positive integer"),
    body("propertyName").notEmpty().withMessage("Property name is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("reservationNo")
      .isInt()
      .withMessage("Reservation number must be an integer"),
    body("reservationCode")
      .notEmpty()
      .withMessage("Reservation code is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("clientName").notEmpty().withMessage("Client name is required"),
    body("clientIdNo").notEmpty().withMessage("Client ID number is required"),
    body("guests").notEmpty().withMessage("Guests information is required"),
    body("clientPhone").notEmpty().withMessage("Client phone is required"),
    body("officialPrice")
      .isFloat({ min: 0 })
      .withMessage("Official price must be a positive number"),
    body("tax")
      .isFloat({ min: 0 })
      .withMessage("Tax must be a non-negative number"),
    body("totalPrice")
      .isFloat({ min: 0 })
      .withMessage("Total price must be a positive number"),
    body("depositBank")
      .isFloat({ min: 0 })
      .withMessage("Deposit bank amount must be a non-negative number"),
    body("cashOnCheckIn")
      .isFloat({ min: 0 })
      .withMessage("Cash on check-in must be a non-negative number"),
    body("damageDeposit")
      .isIn(["yes", "no"])
      .withMessage("Damage deposit must be either 'yes' or 'no'"),
    validate,
  ],
  createOrderController
);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Оновлення замовлення
 *     description: Оновлює існуюче замовлення. Доступно тільки для замовлень агента зі статусом 'draft'.
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
 *               propertyName:
 *                 type: string
 *                 description: Назва об'єкта розміщення
 *               location:
 *                 type: string
 *                 description: Місце розташування
 *               reservationNo:
 *                 type: integer
 *                 description: Номер бронювання
 *               reservationCode:
 *                 type: string
 *                 description: Код бронювання
 *               country:
 *                 type: string
 *                 description: Країна
 *               clientName:
 *                 type: string
 *                 description: Ім'я клієнта
 *               clientIdNo:
 *                 type: string
 *                 description: Номер ID клієнта
 *               guests:
 *                 type: string
 *                 description: Інформація про гостей
 *               clientPhone:
 *                 type: string
 *                 description: Телефон клієнта
 *               officialPrice:
 *                 type: number
 *                 description: Офіційна ціна
 *               tax:
 *                 type: number
 *                 description: Податок
 *               totalPrice:
 *                 type: number
 *                 description: Загальна ціна
 *               depositBank:
 *                 type: number
 *                 description: Сума депозиту до сплати через банк
 *               cashOnCheckIn:
 *                 type: number
 *                 description: Сума до сплати при заїзді
 *               damageDeposit:
 *                 type: string
 *                 enum: [yes, no]
 *                 description: Наявність депозиту за пошкодження
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
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції або замовлення вже підтверджено
 *       404:
 *         description: Замовлення не знайдено
 *       422:
 *         description: Помилка валідації даних
 */
router.put(
  "/:id",
  [
    // Validation
    param("id").isUUID(4).withMessage("Invalid order ID format"),
    body("checkIn")
      .optional()
      .isISO8601()
      .withMessage("Invalid check-in date format"),
    body("checkOut")
      .optional()
      .isISO8601()
      .withMessage("Invalid check-out date format"),
    body("nights")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Nights must be a positive integer"),
    body("propertyName")
      .optional()
      .notEmpty()
      .withMessage("Property name cannot be empty if provided"),
    body("location")
      .optional()
      .notEmpty()
      .withMessage("Location cannot be empty if provided"),
    body("reservationNo")
      .optional()
      .isInt()
      .withMessage("Reservation number must be an integer"),
    body("reservationCode")
      .optional()
      .notEmpty()
      .withMessage("Reservation code cannot be empty if provided"),
    body("country")
      .optional()
      .notEmpty()
      .withMessage("Country cannot be empty if provided"),
    body("clientName")
      .optional()
      .notEmpty()
      .withMessage("Client name cannot be empty if provided"),
    body("clientIdNo")
      .optional()
      .notEmpty()
      .withMessage("Client ID number cannot be empty if provided"),
    body("guests")
      .optional()
      .notEmpty()
      .withMessage("Guests information cannot be empty if provided"),
    body("clientPhone")
      .optional()
      .notEmpty()
      .withMessage("Client phone cannot be empty if provided"),
    body("officialPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Official price must be a positive number"),
    body("tax")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Tax must be a non-negative number"),
    body("totalPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Total price must be a positive number"),
    body("depositBank")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Deposit bank amount must be a non-negative number"),
    body("cashOnCheckIn")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Cash on check-in must be a non-negative number"),
    body("damageDeposit")
      .optional()
      .isIn(["yes", "no"])
      .withMessage("Damage deposit must be either 'yes' or 'no'"),
    validate,
  ],
  updateOrderController
);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Видалення замовлення
 *     description: Видаляє існуюче замовлення. Доступно тільки для замовлень агента зі статусом 'draft'.
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
 *         description: Замовлення успішно видалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: ID видаленого замовлення
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції або замовлення вже підтверджено
 *       404:
 *         description: Замовлення не знайдено
 */
router.delete(
  "/:id",
  [param("id").isUUID(4).withMessage("Invalid order ID format"), validate],
  deleteOrderController
);

/**
 * @swagger
 * /orders/{id}/deposit-paid:
 *   patch:
 *     summary: Відмітка про оплату депозиту
 *     description: Позначає депозит за замовлення як оплачений.
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
 *         description: Депозит успішно позначено як оплачений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Deposit marked as paid successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Замовлення не знайдено
 */
router.patch(
  "/:id/deposit-paid",
  [param("id").isUUID(4).withMessage("Invalid order ID format"), validate],
  markDepositPaidController
);

export default router;
