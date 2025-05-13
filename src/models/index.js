import sequelize from "../config/database.js";
import User from "./user.js";
import Invitation from "./invitation.js";
import Order from "./order.js";

// Define relationships between models
Invitation.belongsTo(User, { foreignKey: "invitedBy", as: "inviter" });
User.hasMany(Invitation, { foreignKey: "invitedBy", as: "invitations" });
User.belongsTo(User, { foreignKey: "managerId", as: "manager" });
User.hasMany(User, { foreignKey: "managerId", as: "agents" });

// Order relationships
Order.belongsTo(User, { foreignKey: "agentId", as: "agent" });
User.hasMany(Order, { foreignKey: "agentId", as: "orders" });
// Sync models with database
const syncModels = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // In development, you might want to use { force: true } to recreate tables
    // In production, use { alter: true } or avoid sync and use migrations instead
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Models synchronized with database");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { sequelize, User, Invitation, Order, syncModels };
