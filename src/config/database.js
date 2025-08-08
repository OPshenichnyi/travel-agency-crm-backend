import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Database configuration based on environment
const getDatabaseConfig = () => {
  if (process.env.NODE_ENV === "production") {
    // PostgreSQL configuration for production - connecting to existing database
    return {
      dialect: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5433,
      database: process.env.DB_NAME || "travel_agency",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      retry: {
        max: 5,
      },
    };
  } else {
    // SQLite configuration for development
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, "../../database.sqlite");

    return {
      dialect: "sqlite",
      storage: dbPath,
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      retry: {
        max: 5,
      },
      transactionType: "IMMEDIATE",
    };
  }
};

const sequelize = new Sequelize(getDatabaseConfig());

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    if (process.env.NODE_ENV === "production") {
      console.log("Connected to PostgreSQL database");
    } else {
      console.log("Connected to SQLite database");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

// Run the test
testConnection();

export default sequelize;
