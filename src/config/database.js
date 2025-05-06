import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Шлях до файлу SQLite
const dbPath = path.join(__dirname, "../../database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 1, // Обмежуємо до одного підключення
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 5, // Кількість спроб при помилці
  },
  transactionType: "IMMEDIATE",
});

export default sequelize;
