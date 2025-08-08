import express from "express";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import invitationRoutes from "./invitationRoutes.js";
import userRoutes from "./userRoutes.js";
import profileRoutes from "./profileRoutes.js";
import agentRoutes from "./agentRoutes.js";
import orderRoutes from "./orderRoutes.js";
import bankAccountRoutes from "./bankAccountRoutes.js";
import sequelize from "../config/database.js";

const router = express.Router();

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Base routes
router.get("/", (req, res) => {
  res.json({
    message: "Travel Agency CRM API",
    version: "1.0.0",
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/invitations", invitationRoutes);
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
router.use("/agents", agentRoutes);
router.use("/orders", orderRoutes);
router.use("/bank-accounts", bankAccountRoutes);

export default router;
