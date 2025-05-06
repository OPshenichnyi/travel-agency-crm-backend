import {
  getAgents,
  updateAgent,
  toggleAgentStatus,
  getAgentById,
} from "../services/agentService.js";

/**
 * Get agents controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAgentsController = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await getAgents(req.user.id, filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update agent controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateAgentController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
    };

    const updatedAgent = await updateAgent(id, agentData, req.user.id);

    res.status(200).json({
      message: "Agent updated successfully",
      agent: updatedAgent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle agent status controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const toggleAgentStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const agent = await toggleAgentStatus(id, isActive, req.user.id);

    res.status(200).json({
      message: `Agent ${isActive ? "activated" : "deactivated"} successfully`,
      agent,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Get agent by ID controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAgentByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get agent from service
    const agent = await getAgentById(id, req.user.id);

    res.status(200).json({
      message: "Agent fetched successfully",
      agent,
    });
  } catch (error) {
    next(error);
  }
};
export {
  getAgentsController,
  updateAgentController,
  toggleAgentStatusController,
  getAgentByIdController,
};
