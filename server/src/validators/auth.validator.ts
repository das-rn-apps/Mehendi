import Joi from "joi";
import { UserRole } from "../enums/userRoles.enum";

const passwordComplexity = Joi.string()
  .min(8)
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/
  )
  .messages({
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    "string.min": "Password must be at least {#limit} characters long.",
    "string.max": "Password cannot be longer than {#limit} characters.",
  });

export const registerSchema = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().required().min(2).max(50),
    lastName: Joi.string().trim().required().min(2).max(50),
    email: Joi.string().trim().email().required(),
    password: passwordComplexity.required(),
    phone: Joi.string()
      .trim()
      .optional()
      .allow("")
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .messages({
        // E.164 format
        "string.pattern.base":
          "Phone number must be in a valid international format (e.g., +1234567890).",
      }),
    role: Joi.string()
      .valid(...Object.values(UserRole))
      .default(UserRole.USER),
    // For artists during registration (optional, can be part of profile setup)
    isArtist: Joi.boolean().optional(), // A flag to potentially change role to ARTIST
    // Add artist-specific fields if registering directly as an artist
    // bio: Joi.string().when('isArtist', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  }),
};

export const loginSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const refreshTokenSchema = {
  body: Joi.object().keys({
    // Or from cookies, adjust middleware accordingly
    refreshToken: Joi.string().required(),
  }),
  // If getting from cookies:
  // cookies: Joi.object().keys({
  //   refreshToken: Joi.string().required(),
  // }).unknown(true), // Allow other cookies
};

export const forgotPasswordSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const resetPasswordSchema = {
  query: Joi.object().keys({
    // Assuming token is in query param
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: passwordComplexity.required(),
  }),
};

export const verifyEmailSchema = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export const sendOtpSchema = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().when("phone", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      }),
      phone: Joi.string()
        .trim()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(), // E.164 format
      purpose: Joi.string()
        .valid("emailVerification", "phoneVerification", "passwordReset")
        .required(),
    })
    .or("email", "phone"), // Either email or phone must be provided
};

export const verifyOtpSchema = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().when("phone", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      }),
      phone: Joi.string()
        .trim()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(),
      otp: Joi.string().required().length(6).pattern(/^\d+$/),
      purpose: Joi.string()
        .valid("emailVerification", "phoneVerification", "passwordReset")
        .required(),
    })
    .or("email", "phone"),
};
