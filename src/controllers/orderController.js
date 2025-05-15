import {
  createOrder,
  getOrderById,
  updateOrder,
  getOrders,
} from "../services/index.js";

/**
 * Create order controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createOrderController = async (req, res, next) => {
  try {
    // For agent users, set agentId to their own ID
    if (req.user.role === "agent") {
      req.body.agentId = req.user.id;
    }

    const orderData = req.body;
    const order = await createOrder(orderData);

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getOrderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id, req.user.id, req.user.role);

    res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    const updatedOrder = await updateOrder(
      id,
      orderData,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getOrdersController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await getOrders(filters, req.user.id, req.user.role);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  createOrderController,
  getOrderByIdController,
  updateOrderController,
  getOrdersController,
};
