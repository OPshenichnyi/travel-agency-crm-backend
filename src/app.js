import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import { syncModels } from "./models/index.js";
import logger from "./utils/logger.js";
import { verifyConnection } from "./services/emailService.js";
import { swaggerSpec, swaggerUi } from "./config/swagger.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// API routes
app.use("/api", routes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      message: "Resource not found",
    },
  });
});

// Error handling
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    // Connect to database and sync models
    await syncModels();

    // Verify email service connection only in development
    if (process.env.NODE_ENV === "development") {
      await verifyConnection();
    }

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
