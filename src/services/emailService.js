import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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

  return transporter.sendMail(mailOptions);
};

// Verify connection
const verifyConnection = async () => {
  if (process.env.NODE_ENV === "production") {
    return transporter.verify();
  }
  return true;
};

export { sendInvitation, verifyConnection };
