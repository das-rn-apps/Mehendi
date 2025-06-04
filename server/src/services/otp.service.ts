import crypto from "crypto";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import httpStatusCodes from "http-status-codes";
import config from "../config";
import { sendEmail } from "./email.service"; // For sending OTP via email
// import { sendSms } from './sms.service'; // If you implement SMS OTP

export const generateOtp = (length = 6): string => {
  // Generate a random numeric OTP
  return crypto.randomInt(10 ** (length - 1), 10 ** length - 1).toString();
};

export const storeOtp = async (
  userId: string,
  otp: string,
  purpose:
    | "emailVerification"
    | "phoneVerification"
    | "passwordReset" = "emailVerification"
): Promise<void> => {
  const expires = new Date(
    Date.now() + config.otp.expirationMinutes * 60 * 1000
  );
  const user = await User.findByIdAndUpdate(
    userId,
    { otp, otpExpires: expires },
    { select: "otp otpExpires" }
  );
  if (!user) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "User not found for OTP storage"
    );
  }
};

export const verifyOtp = async (
  userId: string,
  providedOtp: string
): Promise<boolean> => {
  const user = await User.findById(userId).select("+otp +otpExpires"); // Ensure otp and otpExpires are selected
  if (!user || !user.otp || !user.otpExpires) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "OTP not found or user does not exist."
    );
  }

  if (user.otp !== providedOtp) {
    throw new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid OTP.");
  }

  if (new Date() > user.otpExpires) {
    // Clear expired OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "OTP has expired. Please request a new one."
    );
  }

  // OTP is valid, clear it after verification
  user.otp = undefined;
  user.otpExpires = undefined;
  // You might want to set isEmailVerified or isPhoneVerified to true here depending on the OTP purpose
  // For example: if (purpose === 'emailVerification') user.isEmailVerified = true;
  await user.save();
  return true;
};

export const sendOtpEmail = async (
  email: string,
  name: string,
  otp: string,
  purpose: string = "verification"
): Promise<void> => {
  const subject = `Your MehendiApp ${purpose} OTP`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #333;">Your One-Time Password (OTP)</h2>
      <p>Hello ${name},</p>
      <p>Your OTP for ${purpose} is: <strong style="font-size: 1.2em;">${otp}</strong></p>
      <p>This OTP is valid for ${config.otp.expirationMinutes} minutes.</p>
      <p>If you did not request this OTP, please ignore this email.</p>
      <p>Thanks,<br>The MehendiApp Team</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html: htmlContent });
};

// Add sendOtpSms if you integrate an SMS gateway
