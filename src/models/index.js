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
User.hasMany(Order, { foreignKey: "agentId", as: "orders" });
Order.belongsTo(User, { foreignKey: "agentId", as: "agent" });
// Sync models with database
const syncModels = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // Додайте це логування
    console.log("Models before sync:", Object.keys(sequelize.models));

    // In development, you might want to use { force: true } to recreate tables
    // In production, use { alter: true } or avoid sync and use migrations instead
    await sequelize.sync({
      force: process.env.NODE_ENV === "development",
      logging: console.log,
    });
    console.log("Models synchronized with database");
    const [results] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table';"
    );
    console.log(
      "Tables in database:",
      results.map((r) => r.name)
    );
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    // Додайте детальний вивід помилки
    console.error("Error details:", error.stack);
    throw error;
  }
};

export { sequelize, User, Invitation, Order, syncModels };
