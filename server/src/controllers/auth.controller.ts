import { Response, NextFunction } from "express";
import httpStatusCodes from "http-status-codes";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import ApiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import tokenService from "../services/token.service";
import { IRequest } from "../interfaces/request.interface"; // Your custom request interface
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.service";
import {
  generateOtp,
  storeOtp,
  verifyOtp as verifyOtpService,
  sendOtpEmail,
} from "../services/otp.service";
import config from "../config";
import Token, { TokenType } from "../models/token.model";
import { UserRole } from "../enums/userRoles.enum";
import logger from "../utils/logger";

const setTokenCookie = (
  res: Response,
  tokenName: string,
  token: string,
  expires: Date
) => {
  res.cookie(tokenName, token, {
    httpOnly: true,
    secure: config.env === "production", // Use secure cookies in production
    sameSite: "strict", // Or 'lax' depending on your needs
    expires: expires,
  });
};

export const register = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, password, phone, role, isArtist } =
      req.body;

    if (await User.isEmailTaken(email)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Email already taken")
      );
    }

    const userRole = isArtist ? UserRole.ARTIST : role || UserRole.USER;

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: userRole,
      isProfileComplete: userRole === UserRole.ARTIST ? false : true, // Artists need to complete profile
    });

    // Generate email verification token (or OTP)
    const emailVerifyToken = await tokenService.generateVerifyEmailToken(user);
    // Construct verification URL (replace with your frontend URL)
    const verificationUrl = `${config.corsOrigin}/verify-email?token=${emailVerifyToken}`;
    await sendVerificationEmail(user.email, user.firstName, verificationUrl);

    // Or send OTP for email verification
    // const otp = generateOtp();
    // await storeOtp(user._id.toString(), otp, 'emailVerification');
    // await sendOtpEmail(user.email, user.fullName, otp, 'email verification');

    // Do not send password in response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Potentially log the user in directly or require email verification first
    // For now, let's require email verification

    res
      .status(httpStatusCodes.CREATED)
      .json(
        new ApiResponse(
          httpStatusCodes.CREATED,
          { user: userResponse },
          "Registration successful. Please check your email to verify your account."
        )
      );
  }
);

export const login = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +refreshToken"
    );
    if (!user || !(await user.comparePassword(password))) {
      return next(
        new ApiError(
          httpStatusCodes.UNAUTHORIZED,
          "Incorrect email or password"
        )
      );
    }

    if (!user.isEmailVerified) {
      return next(
        new ApiError(
          httpStatusCodes.UNAUTHORIZED,
          "Please verify your email before logging in."
        )
      );
    }

    if (!user.isActive) {
      return next(
        new ApiError(
          httpStatusCodes.FORBIDDEN,
          "Your account is deactivated. Please contact support."
        )
      );
    }

    const { accessToken, refreshToken } = await tokenService.generateAuthTokens(
      user
    );

    // Calculate expiration times
    const accessTokenExpires = new Date(
      Date.now() +
        parseInt(String(config.jwt.accessTokenExpiration)) * 60 * 1000
    );

    const refreshTokenExpires = new Date(
      Date.now() +
        parseInt(String(config.jwt.refreshTokenExpiration)) *
          24 *
          60 *
          60 *
          1000
    );

    // Set refresh token in HTTP-only cookie
    setTokenCookie(
      res,
      config.jwt.refreshTokenCookieName,
      refreshToken,
      refreshTokenExpires
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const userResponse = user.toObject();

    res.status(httpStatusCodes.OK).json(
      new ApiResponse(
        httpStatusCodes.OK,
        {
          user: userResponse,
          accessToken,
          accessTokenExpires,
          refreshTokenExpires,
        },
        "Login successful"
      )
    );
  }
);

export const logout = asyncHandler(async (req: IRequest, res: Response) => {
  const refreshToken = req.cookies[config.jwt.refreshTokenCookieName];

  if (req.user && refreshToken) {
    const user = await User.findById(req.user._id).select("+refreshToken");
    if (user && user.refreshToken === refreshToken) {
      user.refreshToken = undefined; // Clear the refresh token from user document
      await user.save({ validateBeforeSave: false });
    }
  }

  // Also, if you store refresh tokens in a separate `Token` collection:
  // await Token.deleteOne({ token: refreshToken, type: TokenType.REFRESH });

  res.clearCookie(config.jwt.refreshTokenCookieName, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
  });

  res
    .status(httpStatusCodes.OK)
    .json(new ApiResponse(httpStatusCodes.OK, {}, "Logged out successfully"));
});

export const refreshTokens = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const incomingRefreshToken =
      req.body.refreshToken || req.cookies[config.jwt.refreshTokenCookieName];

    if (!incomingRefreshToken) {
      return next(
        new ApiError(httpStatusCodes.UNAUTHORIZED, "Refresh token not provided")
      );
    }

    try {
      const decoded = jwt.verify(
        incomingRefreshToken,
        config.jwt.secret
      ) as jwt.JwtPayload;

      if (
        typeof decoded.sub !== "string" ||
        decoded.type !== TokenType.REFRESH
      ) {
        throw new ApiError(
          httpStatusCodes.UNAUTHORIZED,
          "Invalid refresh token"
        );
      }

      const user = await User.findById(decoded.sub).select("+refreshToken");

      if (!user || user.refreshToken !== incomingRefreshToken) {
        // Potential token reuse or an old token, invalidate it and force re-login
        if (user) {
          user.refreshToken = undefined;
          await user.save({ validateBeforeSave: false });
        }
        res.clearCookie(config.jwt.refreshTokenCookieName, {
          httpOnly: true,
          secure: config.env === "production",
          sameSite: "strict",
        });
        return next(
          new ApiError(
            httpStatusCodes.FORBIDDEN,
            "Invalid or expired refresh token. Please log in again."
          )
        );
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await tokenService.generateAuthTokens(user);

      const refreshTokenExpires = new Date(
        Date.now() +
          parseInt(String(config.jwt.refreshTokenExpiration)) *
            24 *
            60 *
            60 *
            1000
      );

      setTokenCookie(
        res,
        config.jwt.refreshTokenCookieName,
        newRefreshToken,
        refreshTokenExpires
      );

      res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(
            httpStatusCodes.OK,
            { accessToken },
            "Tokens refreshed successfully"
          )
        );
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // If refresh token itself is expired, clear the cookie.
        const userIdFromExpiredToken = (
          jwt.decode(incomingRefreshToken) as jwt.JwtPayload
        )?.sub;
        if (userIdFromExpiredToken) {
          const user = await User.findById(userIdFromExpiredToken).select(
            "+refreshToken"
          );
          if (user && user.refreshToken === incomingRefreshToken) {
            user.refreshToken = undefined;
            await user.save({ validateBeforeSave: false });
          }
        }
        res.clearCookie(config.jwt.refreshTokenCookieName, {
          httpOnly: true,
          secure: config.env === "production",
          sameSite: "strict",
        });
        return next(
          new ApiError(
            httpStatusCodes.UNAUTHORIZED,
            "Refresh token expired. Please log in again."
          )
        );
      }
      return next(
        new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid refresh token")
      );
    }
  }
);

export const forgotPassword = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // To prevent email enumeration, you might want to send a generic success message even if user not found
      // However, for this example, we'll indicate user not found for clarity during development.
      // In production, consider always returning a success message.
      // return next(new ApiError(httpStatusCodes.NOT_FOUND, 'User with this email does not exist.'));
      logger.warn(`Password reset attempt for non-existent email: ${email}`);
      return res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(
            httpStatusCodes.OK,
            {},
            "If an account with this email exists, a password reset link has been sent."
          )
        );
    }

    // Generate password reset token (could be a JWT or a simple OTP-like token)
    // Using JWT based token from tokenService
    const resetToken = await tokenService.generateResetPasswordToken(email);
    const resetUrl = `${config.corsOrigin}/reset-password?token=${resetToken}`; // Adjust frontend URL

    await sendPasswordResetEmail(user.email, user.firstName, resetUrl);

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          {},
          "Password reset link sent to your email."
        )
      );
  }
);

export const resetPassword = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { token } = req.query as { token: string };
    const { password } = req.body;

    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.RESET_PASSWORD,
      expires: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid or expired password reset token."
        )
      );
    }

    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return next(new ApiError(httpStatusCodes.NOT_FOUND, "User not found."));
    }

    user.password = password; // The pre-save hook in userModel will hash it
    user.refreshToken = undefined; // Force logout from other devices by clearing refresh token
    await user.save();

    // Delete the used reset token
    await Token.deleteOne({ _id: tokenDoc._id });
    // Or blacklist it if you prefer:
    // tokenDoc.blacklisted = true;
    // await tokenDoc.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(httpStatusCodes.OK, {}, "Password reset successfully.")
      );
  }
);

export const verifyEmail = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { token } = req.query as { token: string };

    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.VERIFY_EMAIL,
      expires: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid or expired email verification token."
        )
      );
    }

    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return next(new ApiError(httpStatusCodes.NOT_FOUND, "User not found."));
    }

    if (user.isEmailVerified) {
      return res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(httpStatusCodes.OK, {}, "Email already verified.")
        );
    }

    user.isEmailVerified = true;
    await user.save();

    await Token.deleteOne({ _id: tokenDoc._id }); // Delete the used token

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          {},
          "Email verified successfully. You can now login."
        )
      );
  }
);

export const sendVerificationOtp = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { email, phone, purpose } = req.body;
    let user;

    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return next(new ApiError(httpStatusCodes.NOT_FOUND, "User not found."));
    }

    const otp = generateOtp();
    await storeOtp(user._id.toString(), otp, purpose);

    if (purpose === "emailVerification" && email) {
      await sendOtpEmail(user.email, user.firstName, otp, "email verification");
      return res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(httpStatusCodes.OK, {}, "OTP sent to your email.")
        );
    } else if (purpose === "phoneVerification" && phone) {
      // await sendOtpSms(user.phone, otp); // Implement SMS service
      return res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(
            httpStatusCodes.OK,
            {},
            "OTP sent to your phone (SMS not implemented)."
          )
        );
    } else if (purpose === "passwordReset" && email) {
      await sendOtpEmail(user.email, user.firstName, otp, "password reset");
      return res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(
            httpStatusCodes.OK,
            {},
            "Password reset OTP sent to your email."
          )
        );
    }

    return next(
      new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Invalid purpose or missing contact information."
      )
    );
  }
);

export const verifyOtp = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { email, phone, otp, purpose } = req.body;
    let user;

    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return next(new ApiError(httpStatusCodes.NOT_FOUND, "User not found."));
    }

    await verifyOtpService(user._id.toString(), otp); // This will throw error if OTP is invalid/expired

    let message = "OTP verified successfully.";
    if (purpose === "emailVerification") {
      user.isEmailVerified = true;
      await user.save();
      message = "Email verified successfully. You can now login.";
    } else if (purpose === "phoneVerification") {
      user.isPhoneVerified = true;
      await user.save();
      message = "Phone number verified successfully.";
    } else if (purpose === "passwordReset") {
      // For password reset with OTP, you'd typically allow setting a new password next
      // Or generate a short-lived token for password reset form
      const resetToken = await tokenService.generateResetPasswordToken(
        user.email
      ); // Re-using password reset JWT for consistency
      return res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(
            httpStatusCodes.OK,
            { resetToken },
            "OTP verified. Use this token to reset your password."
          )
        );
    }

    res
      .status(httpStatusCodes.OK)
      .json(new ApiResponse(httpStatusCodes.OK, {}, message));
  }
);

export const getCurrentUser = asyncHandler(
  async (req: IRequest, res: Response) => {
    // req.user is populated by the 'protect' middleware
    if (!req.user) {
      return res
        .status(httpStatusCodes.UNAUTHORIZED)
        .json(new ApiError(httpStatusCodes.UNAUTHORIZED, "Not authenticated"));
    }
    // The user object from req.user might not have all fields due to select('-password')
    // Fetch a fresh copy if needed, or ensure req.user has what you need.
    const user = await User.findById(req.user._id);

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { user },
          "Current user fetched successfully."
        )
      );
  }
);
