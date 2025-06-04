import nodemailer from "nodemailer";
import config from "../config";
import logger from "../utils/logger";

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  // tls: {
  //   rejectUnauthorized: false // For dev/testing only
  // }
});

if (config.env !== "test") {
  transporter
    .verify()
    .then(() =>
      logger.info("Email service configured and ready to send emails.")
    )
    .catch((err) =>
      logger.error(
        `Email service failed to connect. Check your config. Error: ${err.message}`
      )
    );
}

const containerStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f9f6fb;
  padding: 40px 20px;
  color: #4a4a4a;
  max-width: 600px;
  margin: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(200, 162, 200, 0.15);
`;

const heading1Style = `
  font-weight: 700;
  color: #7a2fa6;
  margin-bottom: 16px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const heading2Style = `
  font-weight: 600;
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
`;

const paragraphStyle = `
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 30px;
  text-align: center;
`;

const buttonStyle = `
  background: linear-gradient(135deg, #a464c8, #d69ede);
  color: #fff !important;
  font-weight: 600;
  padding: 14px 36px;
  border-radius: 50px;
  text-decoration: none !important;
  font-size: 16px;
  box-shadow: 0 6px 12px rgba(164, 100, 200, 0.4);
  display: inline-block;
  transition: background 0.3s ease;
`;

const smallTextStyle = `
  font-size: 14px;
  color: #888;
  text-align: center;
  margin-bottom: 10px;
`;

const footerStyle = `
  font-size: 14px;
  color: #aaa;
  text-align: center;
  margin-top: 40px;
`;

export const sendEmail = async (mailOptions: MailOptions): Promise<void> => {
  try {
    const completeMailOptions = {
      from: config.email.from,
      ...mailOptions,
    };
    const info = await transporter.sendMail(completeMailOptions);
    logger.info(`Email sent: ${info.messageId} to ${mailOptions.to}`);
  } catch (error) {
    logger.error(`Error sending email to ${mailOptions.to}:`, error);
  }
};

export const sendVerificationEmail = async (
  to: string,
  name: string,
  verificationLink: string
): Promise<void> => {
  const subject = "Verify Your Email Address for MehendiApp";
  const htmlContent = `
    <div style="${containerStyle}">
      <h1 style="${heading1Style}">MehendiApp</h1>
      <h2 style="${heading2Style}">Welcome, ${name}!</h2>
      <p style="${paragraphStyle}">
        Thanks for signing up! Please verify your email address by clicking the button below.
      </p>
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${verificationLink}" style="${buttonStyle}" 
          onmouseover="this.style.background='linear-gradient(135deg, #8a3db0, #bb7ccc)'" 
          onmouseout="this.style.background='linear-gradient(135deg, #a464c8, #d69ede)'">
          Verify Email
        </a>
      </div>
      <p style="${smallTextStyle}">
        If you did not create an account, no further action is required.
      </p>
      <p style="${footerStyle}">&copy; ${new Date().getFullYear()} MehendiApp Team</p>
    </div>
  `;
  await sendEmail({ to, subject, html: htmlContent });
};

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetLink: string
): Promise<void> => {
  const subject = "Reset Your Password for MehendiApp";
  const htmlContent = `
    <div style="${containerStyle}">
      <h1 style="${heading1Style}">MehendiApp</h1>
      <h2 style="${heading2Style}">Password Reset Request</h2>
      <p style="${paragraphStyle}">Hello ${name},</p>
      <p style="${paragraphStyle}">
        You requested a password reset for your MehendiApp account. Click the button below to reset your password:
      </p>
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${resetLink}" style="${buttonStyle}" 
          onmouseover="this.style.background='linear-gradient(135deg, #8a3db0, #bb7ccc)'" 
          onmouseout="this.style.background='linear-gradient(135deg, #a464c8, #d69ede)'">
          Reset Password
        </a>
      </div>
      <p style="${smallTextStyle}">
        This link will expire in ${config.otp.expirationMinutes} minutes.
      </p>
      <p style="${smallTextStyle}">
        If you did not request a password reset, please ignore this email.
      </p>
      <p style="${footerStyle}">&copy; ${new Date().getFullYear()} MehendiApp Team</p>
    </div>
  `;
  await sendEmail({ to, subject, html: htmlContent });
};

export const sendAppointmentConfirmationEmail = async (
  to: string,
  userName: string,
  artistName: string,
  apptDate: string,
  apptTime: string
): Promise<void> => {
  const subject = "Your Mehendi Appointment is Confirmed!";
  const htmlContent = `
    <div style="${containerStyle}">
      <h1 style="${heading1Style}">MehendiApp</h1>
      <h2 style="${heading2Style}">Appointment Confirmed!</h2>
      <p style="${paragraphStyle}">Hello ${userName},</p>
      <p style="${paragraphStyle}">
        Your mehendi appointment with <strong>${artistName}</strong> has been confirmed.
      </p>
      <p style="${paragraphStyle}">
        <strong>Date:</strong> ${apptDate}<br/>
        <strong>Time:</strong> ${apptTime}
      </p>
      <p style="${paragraphStyle}">We look forward to seeing you!</p>
      <p style="${footerStyle}">&copy; ${new Date().getFullYear()} MehendiApp Team</p>
    </div>
  `;
  await sendEmail({ to, subject, html: htmlContent });
};

export const sendAppointmentUpdateEmail = async (
  to: string,
  userName: string,
  artistName: string,
  apptDate: string,
  apptTime: string,
  status: string
): Promise<void> => {
  const subject = `Mehendi Appointment Update: ${status}`;
  const statusTextColor = status === "cancelled" ? "#b00020" : "#4a4a4a";
  const cautionParagraph =
    status === "cancelled"
      ? `<p style="color: #b00020; font-weight: 600; text-align: center;">
        If this was not intentional, please contact the artist or our support.
      </p>`
      : "";

  const htmlContent = `
    <div style="${containerStyle}">
      <h1 style="${heading1Style}">MehendiApp</h1>
      <h2 style="${heading2Style}">Appointment Update!</h2>
      <p style="${paragraphStyle}">Hello ${userName},</p>
      <p style="${paragraphStyle}; color: ${statusTextColor}; font-weight: 600;">
        Your mehendi appointment with <strong>${artistName}</strong> on ${apptDate} at ${apptTime} has been updated to <strong>${status.toUpperCase()}</strong>.
      </p>
      ${cautionParagraph}
      <p style="${footerStyle}">&copy; ${new Date().getFullYear()} MehendiApp Team</p>
    </div>
  `;
  await sendEmail({ to, subject, html: htmlContent });
};
