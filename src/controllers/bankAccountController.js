import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getBankAccounts,
  getBankAccountByIdentifier,
  getBankAccountById,
} from "../services/bankAccountService.js";
import logger from "../utils/logger.js";

/**
 * Create a new bank account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBankAccountController = async (req, res) => {
  try {
    const { bankName, swift, iban, holderName, address, identifier } = req.body;
    const { id: managerId, role } = req.user;

    // Check if user is manager
    if (role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only managers can create bank accounts",
      });
    }

    const bankAccount = await createBankAccount(
      { bankName, swift, iban, holderName, address, identifier },
      managerId
    );

    res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      data: bankAccount,
    });
  } catch (error) {
    logger.error(`Bank account creation error: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update bank account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBankAccountController = async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, swift, iban, holderName, address, identifier } = req.body;
    const { id: managerId, role } = req.user;

    // Check if user is manager
    if (role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only managers can update bank accounts",
      });
    }

    const bankAccount = await updateBankAccount(
      id,
      { bankName, swift, iban, holderName, address, identifier },
      managerId
    );

    res.status(200).json({
      success: true,
      message: "Bank account updated successfully",
      data: bankAccount,
    });
  } catch (error) {
    logger.error(`Bank account update error: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete bank account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBankAccountController = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: managerId, role } = req.user;

    // Check if user is manager
    if (role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only managers can delete bank accounts",
      });
    }

    const result = await deleteBankAccount(id, managerId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Bank account deletion error: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get bank accounts list
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBankAccountsController = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const bankAccounts = await getBankAccounts(userId, role);

    res.status(200).json({
      success: true,
      message: "Bank accounts retrieved successfully",
      data: bankAccounts,
    });
  } catch (error) {
    logger.error(`Get bank accounts error: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get bank account by identifier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBankAccountByIdentifierController = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { id: userId, role } = req.user;

    const bankAccount = await getBankAccountByIdentifier(
      identifier,
      userId,
      role
    );

    res.status(200).json({
      success: true,
      message: "Bank account retrieved successfully",
      data: bankAccount,
    });
  } catch (error) {
    logger.error(`Get bank account by identifier error: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get bank account by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBankAccountByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const bankAccount = await getBankAccountById(id, userId, role);

    res.status(200).json({
      success: true,
      message: "Bank account retrieved successfully",
      data: bankAccount,
    });
  } catch (error) {
    logger.error(`Get bank account by ID error: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createBankAccountController,
  updateBankAccountController,
  deleteBankAccountController,
  getBankAccountsController,
  getBankAccountByIdentifierController,
  getBankAccountByIdController,
};
