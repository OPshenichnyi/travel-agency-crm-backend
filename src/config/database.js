import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Path to SQLite file
const dbPath = path.join(__dirname, "../../database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 1, // Limit to one connection
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 5, // Number of retry attempts on error
  },
  transactionType: "IMMEDIATE",
});

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Check if database file exists
    const fs = await import("fs");
    if (fs.existsSync(dbPath)) {
      console.log("Database file exists at:", dbPath);
    } else {
      console.log("Database file does not exist at:", dbPath);
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

// Run the test
testConnection();

export default sequelize;
