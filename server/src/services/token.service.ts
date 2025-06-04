import jwt from "jsonwebtoken";
import moment, { Moment } from "moment";
import httpStatusCodes from "http-status-codes";
import config from "../config";
import Token, { TokenType, ITokenDocument } from "../models/token.model";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import { UserRole } from "../enums/userRoles.enum";
import mongoose from "mongoose";
import { IUserDocument } from "@/interfaces/user.interface";

/**
 * Generate token
 */
const generateToken = (
  userId: mongoose.Types.ObjectId,
  role: UserRole,
  expires: Moment,
  type: TokenType,
  secret: string = config.jwt.secret
): string => {
  const payload = {
    sub: userId, // Subject (user ID)
    iat: moment().unix(), // Issued at
    exp: expires.unix(), // Expiration time
    type,
    role, // Include role in the token payload
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 */
const saveToken = async (
  token: string,
  userId: mongoose.Types.ObjectId,
  expires: Moment,
  type: TokenType,
  blacklisted = false
): Promise<ITokenDocument> => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if invalid)
 */
export const verifyToken = async (
  token: string,
  type: TokenType
): Promise<ITokenDocument> => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || payload.type !== type) {
      throw new Error("Invalid token payload");
    }
    const tokenDoc = await Token.findOne({
      token,
      type,
      user: payload.sub,
      blacklisted: false,
    });
    if (!tokenDoc) {
      throw new Error("Token not found or blacklisted");
    }
    return tokenDoc;
  } catch (error) {
    throw new ApiError(
      httpStatusCodes.UNAUTHORIZED,
      "Token verification failed"
    );
  }
};

/**
 * Generate auth tokens (access and refresh)
 */
export const generateAuthTokens = async (
  user: IUserDocument
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessTokenExpires = moment().add(
    config.jwt.accessTokenExpiration,
    "minutes"
  );
  const accessToken = generateToken(
    user._id,
    user.role,
    accessTokenExpires,
    TokenType.REFRESH
  ); // Using REFRESH as a generic type for access token for now

  const refreshTokenExpires = moment().add(
    config.jwt.refreshTokenExpiration,
    "days"
  );
  const refreshToken = generateToken(
    user._id,
    user.role,
    refreshTokenExpires,
    TokenType.REFRESH,
    config.jwt.secret
  ); // Use the same secret or a different one for refresh tokens

  // Save the refresh token to the database (or to the user document)
  // await saveToken(refreshToken, user._id, refreshTokenExpires, TokenType.REFRESH);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Generate reset password token
 */
export const generateResetPasswordToken = async (
  email: string
): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "No user found with this email"
    );
  }
  const expires = moment().add(config.otp.expirationMinutes, "minutes"); // Using OTP expiration for password reset link
  const resetPasswordToken = generateToken(
    user._id,
    user.role,
    expires,
    TokenType.RESET_PASSWORD
  );
  await saveToken(
    resetPasswordToken,
    user._id,
    expires,
    TokenType.RESET_PASSWORD
  );
  return resetPasswordToken;
};

/**
 * Generate verify email token
 */
export const generateVerifyEmailToken = async (
  user: IUserDocument
): Promise<string> => {
  const expires = moment().add(
    config.otp.expirationMinutes * 24 * 60,
    "minutes"
  ); // e.g., 1 day for email verification
  const verifyEmailToken = generateToken(
    user._id,
    user.role,
    expires,
    TokenType.VERIFY_EMAIL
  );
  await saveToken(verifyEmailToken, user._id, expires, TokenType.VERIFY_EMAIL);
  return verifyEmailToken;
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
};
