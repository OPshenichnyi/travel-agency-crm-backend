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
 *     summary: Create new order
 *     description: Creates a new order. Agents can only create orders on their own behalf.
 *     tags: [Orders]
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
 *                 description: Agent ID (for managers and administrators)
 *               agentName:
 *                 type: string
 *                 description: Agent name
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 description: Check-in date
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 description: Check-out date
 *               nights:
 *                 type: integer
 *                 description: Number of nights
 *               countryTravel:
 *                 type: string
 *                 description: Travel country
 *               cityTravel:
 *                 type: string
 *                 description: Travel city
 *               propertyName:
 *                 type: string
 *                 description: Accommodation property name
 *               propertyNumber:
 *                 type: string
 *                 description: Property number
 *               reservationNumber:
 *                 type: string
 *                 description: Reservation number
 *               clientName:
 *                 type: string
 *                 description: Client name
 *               clientPhone:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Client phone numbers
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 description: Client email
 *               clientCountry:
 *                 type: string
 *                 description: Client country
 *               clientDocumentNumber:
 *                 type: string
 *                 description: Client passport or document number
 *               guests:
 *                 type: object
 *                 description: Guest information
 *               officialPrice:
 *                 type: number
 *                 description: Official price
 *               taxClean:
 *                 type: number
 *                 description: Cleaning tax
 *               discount:
 *                 type: number
 *                 description: Discount
 *               totalPrice:
 *                 type: number
 *                 description: Total price
 *               bankAccount:
 *                 type: string
 *                 description: Bank account for payment
 *               depositAmount:
 *                 type: number
 *                 description: Deposit amount
 *               depositStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Deposit payment status
 *               depositDueDate:
 *                 type: string
 *                 format: date
 *                 description: Deposit due date
 *               depositPaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Deposit payment methods
 *               balanceAmount:
 *                 type: number
 *                 description: Balance amount
 *               balanceStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Balance payment status
 *               balanceDueDate:
 *                 type: string
 *                 format: date
 *                 description: Balance due date
 *               balancePaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Balance payment methods
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions to perform operation
 *       422:
 *         description: Data validation error
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
 *     summary: Get list of orders
 *     description: Gets a list of orders. Administrators see all orders, managers only their agents' orders, agents only their own orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Order status filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by client name, country/city of travel, or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of orders
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
 *                   description: Total number of orders
 *                 page:
 *                   type: integer
 *                   description: Current page
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *       401:
 *         description: Authentication required
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
 *     summary: Get order by ID
 *     description: Gets order data by its ID. Administrators see all orders, managers only their agents' orders, agents only their own orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order fetched successfully
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
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions to perform operation
 *       404:
 *         description: Order not found
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
 *     summary: Update order
 *     description: Updates order data. Administrators can update all orders, managers only their agents' orders, agents only their own orders and cannot change order statuses or payments. Agents can only edit deposit and balance amounts up to the point where the manager sets the corresponding payment status as "paid". When the payment status is changed to "paid", the payment date is automatically set.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentName:
 *                 type: string
 *                 description: Agent name
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 description: Check-in date
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 description: Check-out date
 *               nights:
 *                 type: integer
 *                 description: Number of nights
 *               countryTravel:
 *                 type: string
 *                 description: Travel country
 *               cityTravel:
 *                 type: string
 *                 description: Travel city
 *               propertyName:
 *                 type: string
 *                 description: Accommodation property name
 *               propertyNumber:
 *                 type: string
 *                 description: Property number
 *               reservationNumber:
 *                 type: string
 *                 description: Reservation number
 *               clientName:
 *                 type: string
 *                 description: Client name
 *               clientPhone:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Client phone numbers
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 description: Client email
 *               clientCountry:
 *                 type: string
 *                 description: Client country
 *               clientDocumentNumber:
 *                 type: string
 *                 description: Client passport or document number
 *               guests:
 *                 type: object
 *                 description: Guest information
 *               officialPrice:
 *                 type: number
 *                 description: Official price
 *               taxClean:
 *                 type: number
 *                 description: Cleaning tax
 *               discount:
 *                 type: number
 *                 description: Discount
 *               totalPrice:
 *                 type: number
 *                 description: Total price
 *               bankAccount:
 *                 type: string
 *                 description: Bank account for payment
 *               depositAmount:
 *                 type: number
 *                 description: Deposit amount
 *               depositStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Deposit payment status
 *               depositDueDate:
 *                 type: string
 *                 format: date
 *                 description: Deposit due date
 *               depositPaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Deposit payment methods
 *               balanceAmount:
 *                 type: number
 *                 description: Balance amount
 *               balanceStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 default: unpaid
 *                 description: Balance payment status
 *               balanceDueDate:
 *                 type: string
 *                 format: date
 *                 description: Balance due date
 *               balancePaymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Balance payment methods
 *               statusOrder:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 description: Order status (only for administrators and managers)
 *     responses:
 *       200:
 *         description: Order updated successfully
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
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions to perform operation
 *       404:
 *         description: Order not found
 *       422:
 *         description: Data validation error
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
 *     summary: Generate voucher PDF
 *     description: Generates a PDF voucher for an order. Available only for approved orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: PDF voucher generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: No permission or status is not "approved"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: PDF generation error
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
