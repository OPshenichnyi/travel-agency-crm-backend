import { Order, User } from "../models/index.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import { Sequelize } from "sequelize";

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {String} agentId - ID of the agent creating the order
 * @returns {Object} - Created order
 */
const createOrder = async (orderData, agentId) => {
  try {
    // Check if agent exists and is active
    const agent = await User.findOne({
      where: {
        id: agentId,
        role: "agent",
        isActive: true,
      },
    });

    if (!agent) {
      const error = new Error("Agent not found or inactive");
      error.status = 404;
      throw error;
    }

    // Create order
    const order = await Order.create({
      id: uuidv4(),
      agentId,
      ...orderData,
      status: "draft", // Always start as draft
      depositPaid: false, // Default to false
    });

    return order;
  } catch (error) {
    logger.error(`Failed to create order: ${error.message}`);
    throw error;
  }
};

/**
 * Update an existing order
 * @param {String} orderId - Order ID
 * @param {Object} orderData - Updated order data
 * @param {String} agentId - ID of the agent updating the order
 * @returns {Object} - Updated order
 */
const updateOrder = async (orderId, orderData, agentId) => {
  try {
    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        agentId,
      },
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    // Check if order can be updated (only if in draft status)
    if (order.status !== "draft") {
      const error = new Error("Cannot update order after confirmation");
      error.status = 403;
      throw error;
    }

    // Update allowed fields
    const allowedFields = [
      "checkIn",
      "checkOut",
      "nights",
      "propertyName",
      "location",
      "reservationNo",
      "reservationCode",
      "country",
      "clientName",
      "clientIdNo",
      "guests",
      "clientPhone",
      "officialPrice",
      "tax",
      "totalPrice",
      "depositBank",
      "cashOnCheckIn",
      "damageDeposit",
    ];

    allowedFields.forEach((field) => {
      if (orderData[field] !== undefined) {
        order[field] = orderData[field];
      }
    });

    await order.save();

    return order;
  } catch (error) {
    logger.error(`Failed to update order: ${error.message}`);
    throw error;
  }
};

/**
 * Delete an order
 * @param {String} orderId - Order ID
 * @param {String} agentId - ID of the agent deleting the order
 * @returns {Object} - Deleted order ID
 */
const deleteOrder = async (orderId, agentId) => {
  try {
    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        agentId,
      },
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    // Check if order can be deleted (only if in draft status)
    if (order.status !== "draft") {
      const error = new Error("Cannot delete order after confirmation");
      error.status = 403;
      throw error;
    }

    // Delete order
    await order.destroy();

    return { id: orderId };
  } catch (error) {
    logger.error(`Failed to delete order: ${error.message}`);
    throw error;
  }
};

/**
 * Mark order deposit as paid
 * @param {String} orderId - Order ID
 * @param {String} agentId - ID of the agent marking the deposit
 * @returns {Object} - Updated order
 */
const markDepositPaid = async (orderId, agentId) => {
  try {
    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        agentId,
      },
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    // Mark deposit as paid
    order.depositPaid = true;
    await order.save();

    return order;
  } catch (error) {
    logger.error(`Failed to mark deposit as paid: ${error.message}`);
    throw error;
  }
};

/**
 * Get orders for a manager
 * @param {String} managerId - Manager ID
 * @param {Object} filters - Filter parameters
 * @param {String} filters.status - Filter by status
 * @param {String} filters.agentId - Filter by agent ID
 * @param {String} filters.search - Search by client name, property, location
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Object} - List of orders and pagination info
 */
const getManagerOrders = async (managerId, filters) => {
  try {
    const { status, agentId, search, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Get agents managed by this manager
    const agentIds = await User.findAll({
      where: {
        managerId,
        role: "agent",
      },
      attributes: ["id"],
    }).then((agents) => agents.map((agent) => agent.id));

    if (agentIds.length === 0) {
      return {
        orders: [],
        total: 0,
        page: parseInt(page, 10),
        totalPages: 0,
        limit: parseInt(limit, 10),
      };
    }

    // Build where clause
    const where = {
      agentId: {
        [Sequelize.Op.in]: agentIds,
      },
    };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by specific agent if provided
    if (agentId) {
      // Check if the agent belongs to this manager
      if (!agentIds.includes(agentId)) {
        const error = new Error("Agent does not belong to this manager");
        error.status = 403;
        throw error;
      }
      where.agentId = agentId;
    }

    // Search by client name, property, location
    if (search) {
      where[Sequelize.Op.or] = [
        { clientName: { [Sequelize.Op.like]: `%${search}%` } },
        { propertyName: { [Sequelize.Op.like]: `%${search}%` } },
        { location: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    // Get orders with pagination
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "agent",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      orders: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit, 10),
    };
  } catch (error) {
    logger.error(`Failed to get manager orders: ${error.message}`);
    throw error;
  }
};

/**
 * Confirm order (set status to confirmed and generate invoice)
 * @param {String} orderId - Order ID
 * @param {String} managerId - Manager ID confirming the order
 * @returns {Object} - Updated order
 */
const confirmOrder = async (orderId, managerId) => {
  try {
    // Find order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "agent",
          attributes: ["id", "managerId"],
        },
      ],
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    // Check if the agent belongs to this manager
    if (order.agent.managerId !== managerId) {
      const error = new Error("This order does not belong to your agents");
      error.status = 403;
      throw error;
    }

    // Check if order can be confirmed (only if in draft status)
    if (order.status !== "draft") {
      const error = new Error("Order has already been confirmed or paid");
      error.status = 403;
      throw error;
    }

    // Here would go invoice generation logic
    // This is a placeholder - you would integrate with a PDF generation service
    const pdfInvoiceUrl = `https://example.com/invoices/${order.id}.pdf`;

    // Update order status
    order.status = "confirmed";
    order.pdfInvoiceUrl = pdfInvoiceUrl;
    await order.save();

    return order;
  } catch (error) {
    logger.error(`Failed to confirm order: ${error.message}`);
    throw error;
  }
};

/**
 * Confirm payment for order (set status to paid and generate voucher)
 * @param {String} orderId - Order ID
 * @param {String} managerId - Manager ID confirming the payment
 * @returns {Object} - Updated order
 */
const confirmPayment = async (orderId, managerId) => {
  try {
    // Find order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "agent",
          attributes: ["id", "managerId"],
        },
      ],
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    // Check if the agent belongs to this manager
    if (order.agent.managerId !== managerId) {
      const error = new Error("This order does not belong to your agents");
      error.status = 403;
      throw error;
    }

    // Check if order can have payment confirmed (only if in confirmed status)
    if (order.status !== "confirmed") {
      if (order.status === "paid") {
        const error = new Error("Payment has already been confirmed");
        error.status = 403;
        throw error;
      } else {
        const error = new Error(
          "Order must be confirmed before payment can be confirmed"
        );
        error.status = 403;
        throw error;
      }
    }

    // Here would go voucher generation logic
    // This is a placeholder - you would integrate with a PDF generation service
    const pdfVoucherUrl = `https://example.com/vouchers/${order.id}.pdf`;

    // Update order status
    order.status = "paid";
    order.pdfVoucherUrl = pdfVoucherUrl;
    await order.save();

    return order;
  } catch (error) {
    logger.error(`Failed to confirm payment: ${error.message}`);
    throw error;
  }
};
/**
 * Get orders for an agent
 * @param {String} agentId - Agent ID
 * @param {Object} filters - Filter parameters
 * @param {String} filters.status - Filter by status
 * @param {String} filters.search - Search by client name, property, location
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Object} - List of orders and pagination info
 */
const getAgentOrders = async (agentId, filters) => {
  try {
    const { status, search, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {
      agentId,
    };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Search by client name, property, location
    if (search) {
      where[Sequelize.Op.or] = [
        { clientName: { [Sequelize.Op.like]: `%${search}%` } },
        { propertyName: { [Sequelize.Op.like]: `%${search}%` } },
        { location: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    // Get orders with pagination
    const { count, rows } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      orders: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit, 10),
    };
  } catch (error) {
    logger.error(`Failed to get agent orders: ${error.message}`);
    throw error;
  }
};
export {
  createOrder,
  updateOrder,
  deleteOrder,
  markDepositPaid,
  getAgentOrders,
  getManagerOrders,
  confirmOrder,
  confirmPayment,
};
