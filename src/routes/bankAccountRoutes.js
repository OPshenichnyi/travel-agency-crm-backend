import express from "express";
import {
  createBankAccountController,
  updateBankAccountController,
  deleteBankAccountController,
  getBankAccountsController,
  getBankAccountByIdentifierController,
} from "../controllers/bankAccountController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateBankAccount } from "../middleware/validationMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BankAccount:
 *       type: object
 *       required:
 *         - bankName
 *         - swift
 *         - iban
 *         - holderName
 *         - identifier
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the bank account
 *         managerId:
 *           type: string
 *           format: uuid
 *           description: ID of the manager who owns this account
 *         bankName:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Name of the bank
 *         swift:
 *           type: string
 *           pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'
 *           description: SWIFT/BIC code (8 or 11 characters)
 *         iban:
 *           type: string
 *           pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$'
 *           description: IBAN number
 *         holderName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Name of the account holder
 *         address:
 *           type: string
 *           maxLength: 200
 *           description: Optional address
 *         identifier:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Unique identifier for this manager (e.g., "My Account 1")
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         manager:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /bank-accounts:
 *   post:
 *     summary: Create a new bank account
 *     description: Create a new bank account (managers only)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - swift
 *               - iban
 *               - holderName
 *               - identifier
 *             properties:
 *               bankName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               swift:
 *                 type: string
 *                 pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'
 *               iban:
 *                 type: string
 *                 pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$'
 *               holderName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               address:
 *                 type: string
 *                 maxLength: 200
 *               identifier:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Bank account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied - only managers can create bank accounts
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authenticate,
  validateBankAccount,
  createBankAccountController
);

/**
 * @swagger
 * /bank-accounts/{id}:
 *   put:
 *     summary: Update a bank account
 *     description: Update an existing bank account (managers only)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               swift:
 *                 type: string
 *                 pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'
 *               iban:
 *                 type: string
 *                 pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$'
 *               holderName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               address:
 *                 type: string
 *                 maxLength: 200
 *               identifier:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Bank account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied - only managers can update bank accounts
 *       404:
 *         description: Bank account not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  authenticate,
  validateBankAccount,
  updateBankAccountController
);

/**
 * @swagger
 * /bank-accounts/{id}:
 *   delete:
 *     summary: Delete a bank account
 *     description: Delete an existing bank account (managers only)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank account ID
 *     responses:
 *       200:
 *         description: Bank account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied - only managers can delete bank accounts
 *       404:
 *         description: Bank account not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticate, deleteBankAccountController);

/**
 * @swagger
 * /bank-accounts:
 *   get:
 *     summary: Get bank accounts list
 *     description: Get list of bank accounts based on user role
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Invalid user role
 *       404:
 *         description: Agent not found or not assigned to a manager
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, getBankAccountsController);

/**
 * @swagger
 * /bank-accounts/{identifier}:
 *   get:
 *     summary: Get bank account by identifier
 *     description: Get a specific bank account by its identifier
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account identifier
 *     responses:
 *       200:
 *         description: Bank account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Invalid user role
 *       404:
 *         description: Bank account not found or agent not assigned to a manager
 *       500:
 *         description: Server error
 */
router.get("/:identifier", authenticate, getBankAccountByIdentifierController);

export default router;
