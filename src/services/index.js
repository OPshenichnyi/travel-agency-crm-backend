import { login, register } from "./authService.js";
import { generateToken } from "./jwtService.js";
import { sendInvitation, verifyConnection } from "./emailService.js";
import { registerFirstAdmin } from "./adminService.js";
import {
  createInvitation,
  getInvitations,
  cancelInvitation,
} from "./invitationService.js";
import { toggleUserStatus, getUsers } from "./userService.js";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "./profileService.js";
import { getAgents, updateAgent, toggleAgentStatus } from "./agentService.js";

import {
  createOrder,
  getOrderById,
  updateOrder,
  getOrders,
} from "./orderService.js";

export {
  login,
  register,
  generateToken,
  sendInvitation,
  verifyConnection,
  registerFirstAdmin,
  createInvitation,
  getInvitations,
  cancelInvitation,
  toggleUserStatus,
  getUsers,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAgents,
  updateAgent,
  toggleAgentStatus,
  createOrder,
  getOrderById,
  updateOrder,
  getOrders,
};
