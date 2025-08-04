import { Order, User } from "../models/index.js";
import { Op } from "sequelize";
import logger from "../utils/logger.js";
import sequelize from "../config/database.js";

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Object} - Created order
 */
const createOrder = async (orderData) => {
  try {
    // Check if agent exists
    const agent = await User.findOne({
      where: { id: orderData.agentId, role: "agent", isActive: true },
    });

    if (!agent) {
      const error = new Error("Agent not found or inactive");
      error.status = 404;
      throw error;
    }

    // Create order
    const order = await Order.create(orderData);

    return order;
  } catch (error) {
    logger.error(`Failed to create order: ${error.message}`);
    throw error;
  }
};

/**
 * Get order by ID
 * @param {String} orderId - Order ID
 * @param {String} userId - ID of the user requesting the order
 * @param {String} userRole - Role of the user requesting the order
 * @returns {Object} - Order data
 */
const getOrderById = async (orderId, userId, userRole) => {
  try {
    let whereCondition = { id: orderId };

    // If user is an agent, they can only see their own orders
    if (userRole === "agent") {
      whereCondition.agentId = userId;
    }
    // If user is a manager, they can only see orders of their agents
    else if (userRole === "manager") {
      // Get IDs of all agents managed by this manager
      const agentIds = await User.findAll({
        where: { managerId: userId },
        attributes: ["id"],
      }).then((agents) => agents.map((agent) => agent.id));

      // Add condition to only show orders of agents managed by this manager
      whereCondition.agentId = agentIds;
    }
    // Admin can see all orders without additional conditions

    const order = await Order.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "agent",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    return order;
  } catch (error) {
    logger.error(`Failed to get order: ${error.message}`);
    throw error;
  }
};

/**
 * Update order
 * @param {String} orderId - Order ID
 * @param {Object} orderData - Order data to update
 * @param {String} userId - ID of the user updating the order
 * @param {String} userRole - Role of the user updating the order
 * @returns {Object} - Updated order
 */
const updateOrder = async (orderId, orderData, userId, userRole) => {
  try {
    // Find the order
    const order = await Order.findByPk(orderId);

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    // Check if user has permission to update this order
    if (userRole === "agent" && order.agentId !== userId) {
      const error = new Error("You are not authorized to update this order");
      error.status = 403;
      throw error;
    } else if (userRole === "manager") {
      // Check if order belongs to an agent managed by this manager
      const agent = await User.findOne({
        where: { id: order.agentId, managerId: userId },
      });

      if (!agent) {
        const error = new Error("You are not authorized to update this order");
        error.status = 403;
        throw error;
      }
    }
    // Admin can update any order

    // If user is agent, they cannot update status fields
    if (userRole === "agent") {
      // Remove status fields from orderData
      delete orderData.statusOrder;

      // Preserve payment statuses
      if (orderData.payments) {
        if (orderData.payments.deposit) {
          delete orderData.payments.deposit.status;
        }
        if (orderData.payments.balance) {
          delete orderData.payments.balance.status;
        }
      }
    }

    // Update only allowed fields
    const allowedFields = [
      "agentName",
      "checkIn",
      "checkOut",
      "nights",
      "reservationNumber",
      "clientName",
      "clientPhone",
      "clientEmail",
      "clientCountry",
      "clientDocumentNumber",
      "countryTravel",
      "cityTravel",
      "propertyName",
      "propertyNumber",
      "guests",
      "officialPrice",
      "taxClean",
      "discount",
      "totalPrice",
      "bankAccount",
    ];

    // For non-agent users, add status fields to allowed fields
    if (userRole !== "agent") {
      allowedFields.push(
        "statusOrder",
        "depositStatus",
        "depositPaidDate",
        "balanceStatus",
        "balancePaidDate"
      );
    }

    // Apply updates
    allowedFields.forEach((field) => {
      if (orderData[field] !== undefined) {
        order[field] = orderData[field];
      }
    });

    // Handle payment status updates with paidDate
    if (userRole !== "agent") {
      // Update deposit status
      if (orderData.depositStatus) {
        order.depositStatus = orderData.depositStatus;
        if (orderData.depositStatus === "paid" && !order.depositPaidDate) {
          order.depositPaidDate = new Date().toISOString().split("T")[0];
        }
      }

      // Update balance status
      if (orderData.balanceStatus) {
        order.balanceStatus = orderData.balanceStatus;
        if (orderData.balanceStatus === "paid" && !order.balancePaidDate) {
          order.balancePaidDate = new Date().toISOString().split("T")[0];
        }
      }
    }

    // Calculate total price if price components have changed
    if (
      orderData.officialPrice !== undefined ||
      orderData.taxClean !== undefined ||
      orderData.discount !== undefined
    ) {
      const discount = order.discount || 0;
      order.totalPrice = order.officialPrice + (order.taxClean || 0) - discount;
    }

    await order.save();

    return order;
  } catch (error) {
    logger.error(`Failed to update order: ${error.message}`);
    throw error;
  }
};

/**
 * Get orders list
 * @param {Object} filters - Filter parameters
 * @param {String} userId - ID of the user requesting the orders
 * @param {String} userRole - Role of the user requesting the orders
 * @returns {Object} - List of orders and pagination info
 */
const getOrders = async (filters, userId, userRole) => {
  const { status, search, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  try {
    let whereCondition = {};

    // Apply status filter if provided
    if (status) {
      whereCondition.statusOrder = status;
    }

    // Apply search filter if provided
    if (search) {
      whereCondition[Op.or] = [
        { clientName: { [Op.like]: `%${search}%` } },
        { countryTravel: { [Op.like]: `%${search}%` } },
        { cityTravel: { [Op.like]: `%${search}%` } },
        { clientEmail: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by user role
    if (userRole === "agent") {
      // Agents can only see their own orders
      whereCondition.agentId = userId;
    } else if (userRole === "manager") {
      // Managers can see orders of their agents
      const agentIds = await User.findAll({
        where: { managerId: userId },
        attributes: ["id"],
      }).then((agents) => agents.map((agent) => agent.id));

      whereCondition.agentId = agentIds;
    }
    // Admins can see all orders

    const { count, rows } = await Order.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "agent",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    return {
      orders: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit, 10),
    };
  } catch (error) {
    logger.error(`Failed to get orders: ${error.message}`);
    throw error;
  }
};

export { createOrder, getOrderById, updateOrder, getOrders };
