import {
  getManagerOrders,
  confirmOrder,
  confirmPayment,
} from "../services/index.js";

/**
 * Get orders for manager controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getManagerOrdersController = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const filters = {
      status: req.query.status,
      agentId: req.query.agentId,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await getManagerOrders(managerId, filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm order controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const confirmOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const order = await confirmOrder(id, managerId);

    res.status(200).json({
      message: "Order confirmed successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const confirmPaymentController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const order = await confirmPayment(id, managerId);

    res.status(200).json({
      message: "Payment confirmed successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getManagerOrdersController,
  confirmOrderController,
  confirmPaymentController,
};
