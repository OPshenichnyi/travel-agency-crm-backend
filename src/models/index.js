import sequelize from "../config/database.js";
import User from "./user.js";
import Invitation from "./invitation.js";
import Order from "./order.js";
import BankAccount from "./bankAccount.js";

// Define relationships between models
Invitation.belongsTo(User, { foreignKey: "invitedBy", as: "inviter" });
User.hasMany(Invitation, { foreignKey: "invitedBy", as: "invitations" });
User.belongsTo(User, { foreignKey: "managerId", as: "manager" });
User.hasMany(User, { foreignKey: "managerId", as: "agents" });

// Order relationships
User.hasMany(Order, { foreignKey: "agentId", as: "orders" });
Order.belongsTo(User, { foreignKey: "agentId", as: "agent" });

// BankAccount relationships
User.hasMany(BankAccount, { foreignKey: "managerId", as: "bankAccounts" });
BankAccount.belongsTo(User, { foreignKey: "managerId", as: "manager" });

// Sync models with database
const syncModels = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // Add this logging
    console.log("Models before sync:", Object.keys(sequelize.models));

    // Use alter: true for development to preserve data, or no sync for production
    // Only use force: true when you want to completely reset the database
    const syncOptions = {
      alter: false, // Disable alter to avoid unique constraint issues
      force: process.env.FORCE_SYNC === "true", // Only force sync when explicitly set
      logging: console.log,
    };

    console.log("Sync options:", syncOptions);

    await sequelize.sync(syncOptions);
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
    // Add detailed error output
    console.error("Error details:", error.stack);
    throw error;
  }
};

export { sequelize, User, Invitation, Order, BankAccount, syncModels };
