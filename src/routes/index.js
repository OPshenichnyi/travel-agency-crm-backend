import express from "express";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import invitationRoutes from "./invitationRoutes.js";
import userRoutes from "./userRoutes.js";
import profileRoutes from "./profileRoutes.js";
import agentRoutes from "./agentRoutes.js";
import orderRoutes from "./orderRoutes.js";

const router = express.Router();

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

export default router;
