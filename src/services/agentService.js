import { User } from "../models/index.js";
import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";

/**
 * Get agents for a manager
 * @param {String} managerId - Manager ID
 * @param {Object} filters - Filter parameters
 * @param {String} filters.search - Search by email, firstName, lastName
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Object} - List of agents and pagination info
 */
const getAgents = async (managerId, filters) => {
  const { search, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  // Отримуємо роль користувача
  const manager = await User.findByPk(managerId);

  const where = {
    role: "agent",
  };

  // Якщо користувач - менеджер, показуємо тільки його агентів
  if (manager && manager.role === "manager") {
    where.managerId = managerId;
  }

  // Пошук за email, firstName, lastName
  if (search) {
    where[Sequelize.Op.or] = [
      { email: { [Sequelize.Op.like]: `%${search}%` } },
      { firstName: { [Sequelize.Op.like]: `%${search}%` } },
      { lastName: { [Sequelize.Op.like]: `%${search}%` } },
    ];
  }

  try {
    // Знаходимо всіх агентів
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: [
        "id",
        "email",
        "firstName",
        "lastName",
        "phone",
        "isActive",
        "createdAt",
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      agents: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit, 10),
    };
  } catch (error) {
    logger.error(`Failed to get agents: ${error.message}`);
    throw error;
  }
};

/**
 * Update agent data by manager
 * @param {String} agentId - Agent ID
 * @param {Object} agentData - Agent data to update
 * @returns {Object} - Updated agent
 */
const updateAgent = async (agentId, agentData, managerId) => {
  try {
    // Отримуємо користувача, який робить запит
    const manager = await User.findByPk(managerId);

    let whereCondition = {
      id: agentId,
      role: "agent",
    };

    // Якщо користувач - менеджер, він може редагувати лише своїх агентів
    if (manager && manager.role === "manager") {
      whereCondition.managerId = managerId;
    }

    const agent = await User.findOne({
      where: whereCondition,
    });

    if (!agent) {
      const error = new Error("Agent not found");
      error.status = 404;
      throw error;
    }

    // Оновлюємо лише дозволені поля
    const allowedFields = ["firstName", "lastName", "phone"];
    allowedFields.forEach((field) => {
      if (agentData[field] !== undefined) {
        agent[field] = agentData[field];
      }
    });

    await agent.save();

    return {
      id: agent.id,
      email: agent.email,
      firstName: agent.firstName,
      lastName: agent.lastName,
      phone: agent.phone,
      isActive: agent.isActive,
      createdAt: agent.createdAt,
      managerId: agent.managerId,
    };
  } catch (error) {
    logger.error(`Failed to update agent: ${error.message}`);
    throw error;
  }
};

/**
 * Toggle agent active status
 * @param {String} agentId - Agent ID
 * @param {Boolean} isActive - New active status
 * @returns {Object} - Updated agent
 */
const toggleAgentStatus = async (agentId, isActive, managerId) => {
  try {
    // Отримуємо користувача, який робить запит
    const manager = await User.findByPk(managerId);

    let whereCondition = {
      id: agentId,
      role: "agent",
    };

    // Якщо користувач - менеджер, він може змінювати статус лише своїх агентів
    if (manager && manager.role === "manager") {
      whereCondition.managerId = managerId;
    }

    const agent = await User.findOne({
      where: whereCondition,
    });

    if (!agent) {
      const error = new Error("Agent not found");
      error.status = 404;
      throw error;
    }

    // Оновлюємо статус
    await User.update(
      { isActive: isActive ? 1 : 0 },
      { where: { id: agentId } }
    );

    // Отримуємо оновлені дані агента
    const updatedAgent = await User.findByPk(agentId);

    return {
      id: updatedAgent.id,
      email: updatedAgent.email,
      role: updatedAgent.role,
      firstName: updatedAgent.firstName,
      lastName: updatedAgent.lastName,
      phone: updatedAgent.phone,
      isActive: Boolean(updatedAgent.isActive),
      createdAt: updatedAgent.createdAt,
      managerId: updatedAgent.managerId,
    };
  } catch (error) {
    logger.error(`Failed to toggle agent status: ${error.message}`);
    throw error;
  }
};

/**
 * Get agent by ID
 * @param {string} id - Agent ID
 * @param {string} requestingUserId - ID of the user making the request
 * @returns {Promise<Object>} - Agent data
 */
const getAgentById = async (id, requestingUserId) => {
  // Отримуємо користувача, який робить запит
  const requestingUser = await User.findByPk(requestingUserId);

  if (!requestingUser) {
    const error = new Error("Unauthorized access");
    error.status = 401;
    throw error;
  }

  // Формуємо умову запиту залежно від ролі
  let whereCondition = { id, role: "agent" };

  // Якщо користувач - менеджер, він може бачити лише своїх агентів
  if (requestingUser.role === "manager") {
    whereCondition.managerId = requestingUserId;
  }

  // Шукаємо агента в базі даних
  const agent = await User.findOne({
    where: whereCondition,
    attributes: [
      "id",
      "email",
      "firstName",
      "lastName",
      "phone",
      "isActive",
      "createdAt",
      "managerId",
    ],
  });

  // Якщо агента не знайдено, викидаємо помилку
  if (!agent) {
    const error = new Error("Agent not found");
    error.status = 404;
    throw error;
  }

  return agent;
};

export { getAgents, updateAgent, toggleAgentStatus, getAgentById };
