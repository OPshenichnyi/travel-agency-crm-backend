const winston = require("winston");
const path = require("path");

// Налаштування форматів
const formats = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Створення логгера
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: formats,
  transports: [
    // Логування в консоль
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), formats),
    }),
    // Логування помилок у файл
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
    }),
    // Загальне логування у файл
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/app.log"),
    }),
  ],
});

module.exports = logger;
