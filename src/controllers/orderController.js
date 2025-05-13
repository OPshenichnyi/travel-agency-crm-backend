import {
  createOrder,
  updateOrder,
  deleteOrder,
  markDepositPaid,
  getAgentOrders,
} from "../services/index.js";

/**
 * Create order controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createOrderController = async (req, res, next) => {
  try {
    const orderData = req.body;
    const agentId = req.user.id;

    const order = await createOrder(orderData, agentId);

    res.status(201).json({
      message: "Order created successfully",
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
    const agentId = req.user.id;

    const order = await updateOrder(id, orderData, agentId);

    res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const result = await deleteOrder(id, agentId);

    res.status(200).json({
      message: "Order deleted successfully",
      id: result.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark deposit paid controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const markDepositPaidController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const order = await markDepositPaid(id, agentId);

    res.status(200).json({
      message: "Deposit marked as paid successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Get agent orders controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAgentOrdersController = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await getAgentOrders(agentId, filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  createOrderController,
  updateOrderController,
  deleteOrderController,
  markDepositPaidController,
  getAgentOrdersController,
};
