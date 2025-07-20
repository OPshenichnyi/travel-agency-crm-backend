import { BankAccount, User } from "../models/index.js";
import logger from "../utils/logger.js";

/**
 * Create a new bank account
 * @param {Object} accountData - Bank account data
 * @param {String} managerId - Manager ID
 * @returns {Object} - Created bank account
 */
const createBankAccount = async (accountData, managerId) => {
  try {
    // Check if manager exists and is active
    const manager = await User.findOne({
      where: { id: managerId, role: "manager", isActive: true },
    });

    if (!manager) {
      const error = new Error("Manager not found or inactive");
      error.status = 404;
      throw error;
    }

    // Check if identifier is unique for this manager
    const existingAccount = await BankAccount.findOne({
      where: { managerId, identifier: accountData.identifier },
    });

    if (existingAccount) {
      const error = new Error("Identifier must be unique for this manager");
      error.status = 400;
      throw error;
    }

    // Create bank account
    const bankAccount = await BankAccount.create({
      ...accountData,
      managerId,
    });

    return bankAccount;
  } catch (error) {
    logger.error(`Failed to create bank account: ${error.message}`);
    throw error;
  }
};

/**
 * Update bank account
 * @param {String} accountId - Bank account ID
 * @param {Object} accountData - Bank account data to update
 * @param {String} managerId - Manager ID
 * @returns {Object} - Updated bank account
 */
const updateBankAccount = async (accountId, accountData, managerId) => {
  try {
    // Find the bank account
    const bankAccount = await BankAccount.findByPk(accountId);

    if (!bankAccount) {
      const error = new Error("Bank account not found");
      error.status = 404;
      throw error;
    }

    // Check if user has permission to update this account
    if (bankAccount.managerId !== managerId) {
      const error = new Error(
        "You are not authorized to update this bank account"
      );
      error.status = 403;
      throw error;
    }

    // If identifier is being updated, check uniqueness
    if (
      accountData.identifier &&
      accountData.identifier !== bankAccount.identifier
    ) {
      const existingAccount = await BankAccount.findOne({
        where: { managerId, identifier: accountData.identifier },
      });

      if (existingAccount) {
        const error = new Error("Identifier must be unique for this manager");
        error.status = 400;
        throw error;
      }
    }

    // Update account
    await bankAccount.update(accountData);

    return bankAccount;
  } catch (error) {
    logger.error(`Failed to update bank account: ${error.message}`);
    throw error;
  }
};

/**
 * Delete bank account
 * @param {String} accountId - Bank account ID
 * @param {String} managerId - Manager ID
 * @returns {Object} - Deleted bank account
 */
const deleteBankAccount = async (accountId, managerId) => {
  try {
    // Find the bank account
    const bankAccount = await BankAccount.findByPk(accountId);

    if (!bankAccount) {
      const error = new Error("Bank account not found");
      error.status = 404;
      throw error;
    }

    // Check if user has permission to delete this account
    if (bankAccount.managerId !== managerId) {
      const error = new Error(
        "You are not authorized to delete this bank account"
      );
      error.status = 403;
      throw error;
    }

    // Delete account
    await bankAccount.destroy();

    return { message: "Bank account deleted successfully" };
  } catch (error) {
    logger.error(`Failed to delete bank account: ${error.message}`);
    throw error;
  }
};

/**
 * Get bank accounts list
 * @param {String} userId - User ID
 * @param {String} userRole - User role
 * @returns {Array} - List of bank accounts
 */
const getBankAccounts = async (userId, userRole) => {
  try {
    let whereCondition = {};

    if (userRole === "manager") {
      // Managers can see their own accounts
      whereCondition.managerId = userId;
    } else if (userRole === "agent") {
      // Agents can see accounts of their manager
      const agent = await User.findByPk(userId);
      if (!agent || !agent.managerId) {
        const error = new Error("Agent not found or not assigned to a manager");
        error.status = 404;
        throw error;
      }
      whereCondition.managerId = agent.managerId;
    } else if (userRole === "admin") {
      // Admin can see all accounts
      // No additional conditions needed
    } else {
      const error = new Error("Invalid user role");
      error.status = 400;
      throw error;
    }

    const bankAccounts = await BankAccount.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return bankAccounts;
  } catch (error) {
    logger.error(`Failed to get bank accounts: ${error.message}`);
    throw error;
  }
};

/**
 * Get bank account by identifier
 * @param {String} identifier - Bank account identifier
 * @param {String} userId - User ID
 * @param {String} userRole - User role
 * @returns {Object} - Bank account
 */
const getBankAccountByIdentifier = async (identifier, userId, userRole) => {
  try {
    let whereCondition = { identifier };

    if (userRole === "manager") {
      // Managers can see their own accounts
      whereCondition.managerId = userId;
    } else if (userRole === "agent") {
      // Agents can see accounts of their manager
      const agent = await User.findByPk(userId);
      if (!agent || !agent.managerId) {
        const error = new Error("Agent not found or not assigned to a manager");
        error.status = 404;
        throw error;
      }
      whereCondition.managerId = agent.managerId;
    } else if (userRole === "admin") {
      // Admin can see all accounts
      // No additional conditions needed
    } else {
      const error = new Error("Invalid user role");
      error.status = 400;
      throw error;
    }

    const bankAccount = await BankAccount.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    if (!bankAccount) {
      const error = new Error("Bank account not found");
      error.status = 404;
      throw error;
    }

    return bankAccount;
  } catch (error) {
    logger.error(`Failed to get bank account by identifier: ${error.message}`);
    throw error;
  }
};

export {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getBankAccounts,
  getBankAccountByIdentifier,
};
