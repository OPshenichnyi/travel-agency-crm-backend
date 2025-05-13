// src/services/emailService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === "465", // true для 465, false для інших портів
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Додаємо налаштування для розробки
  ...(process.env.NODE_ENV === "development" && {
    tls: {
      rejectUnauthorized: false, // В режимі розробки не перевіряємо сертифікати
    },
  }),
});

/**
 * Send invitation email
 * @param {String} to - Recipient email
 * @param {String} role - User role (manager or agent)
 * @param {String} token - Registration token
 * @param {String} inviterName - Name of the user who sent the invitation
 * @returns {Promise} - Email sending result
 */
const sendInvitation = async (
  to,
  role,
  token,
  inviterName = "Administrator"
) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const registrationLink = `${baseUrl}/register/${token}`;

  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

  const mailOptions = {
    from: `"Travel Agency CRM" <${
      process.env.SMTP_FROM || process.env.SMTP_USER
    }>`,
    to,
    subject: `Invitation to join Travel Agency CRM as ${roleCapitalized}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Travel Agency CRM</h2>
        <p>Hello,</p>
        <p>You have been invited by ${inviterName} to join Travel Agency CRM as a ${role}.</p>
        <p>Please click the button below to complete your registration:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a 
            href="${registrationLink}" 
            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-weight: bold;"
          >
            Complete Registration
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${registrationLink}">${registrationLink}</a></p>
        <p>This invitation link will expire in 7 days.</p>
        <p>Thank you,<br>Travel Agency CRM Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `Invitation email sent to ${to}. Message ID: ${info.messageId}`
    );
    return info;
  } catch (error) {
    logger.error(`Failed to send invitation email: ${error.message}`);

    // В режимі розробки просто логуємо помилку і продовжуємо роботу
    if (process.env.NODE_ENV === "development") {
      logger.info("Email sending failed, but continuing in development mode");
      return { messageId: "dev-mode-no-email-sent" };
    }

    throw error;
  }
};

// Verify connection
const verifyConnection = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      const result = await transporter.verify();
      logger.info("SMTP connection verified successfully");
      return result;
    }

    // В режимі розробки виконуємо спробу перевірки, але не зупиняємо додаток при помилці
    try {
      const result = await transporter.verify();
      logger.info("SMTP connection verified successfully");
      return result;
    } catch (devError) {
      logger.warn(
        `SMTP verification failed in development mode: ${devError.message}`
      );
      logger.info("Continuing without email verification in development mode");
      return true;
    }
  } catch (error) {
    logger.error(`Failed to verify email connection: ${error.message}`);

    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return true;
  }
};

export { sendInvitation, verifyConnection };
