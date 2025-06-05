import Joi from "joi";
import { UserRole } from "../enums/userRoles.enum"; // Assuming UserRole is in enums

// Password complexity can be reused from auth.validator or defined here
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
  });

export const objectIdSchema = Joi.string().hex().length(24).messages({
  "string.hex": "Must be a valid hexadecimal string.",
  "string.length": "Must be 24 characters long.",
});

export const createUserSchema = {
  // Admin creating a user
  body: Joi.object().keys({
    firstName: Joi.string().trim().required().min(2).max(50),
    lastName: Joi.string().trim().required().min(2).max(50),
    email: Joi.string().trim().email().required(),
    password: passwordComplexity.required(),
    phone: Joi.string()
      .trim()
      .optional()
      .allow("")
      .pattern(/^\+?[1-9]\d{1,14}$/),
    role: Joi.string()
      .valid(...Object.values(UserRole))
      .default(UserRole.USER),
    isEmailVerified: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

export const updateUserSchema = {
  // User updating their own profile
  params: Joi.object().keys({
    userId: objectIdSchema.optional(), // Optional if updating self via /me
  }),
  body: Joi.object()
    .keys({
      firstName: Joi.string().trim().min(2).max(50).optional(),
      lastName: Joi.string().trim().min(2).max(50).optional(),
      phone: Joi.string()
        .trim()
        .optional()
        .allow("")
        .pattern(/^\+?[1-9]\d{1,14}$/),
      // Avatar will be handled by a separate upload endpoint
      // Artist specific fields
      bio: Joi.string().trim().max(1000).optional().allow(""),
      availability: Joi.array()
        .items(
          Joi.object({
            day: Joi.string()
              .valid(
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              )
              .required(),
            startTime: Joi.string()
              .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .required()
              .messages({
                "string.pattern.base": "Start time must be in HH:MM format.",
              }),
            endTime: Joi.string()
              .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .required()
              .messages({
                "string.pattern.base": "End time must be in HH:MM format.",
              }),
            isAvailable: Joi.boolean().default(true),
          })
        )
        .optional()
        .max(7), // Max 7 days
      yearsOfExperience: Joi.number().min(0).max(50).optional(),
      specializations: Joi.array()
        .items(Joi.string().trim().max(50))
        .optional(),
      location: Joi.object({
        address: Joi.string().trim().max(255).optional(),
        // coordinates: Joi.array().items(Joi.number()).length(2).optional(), // [longitude, latitude]
      }).optional(),
      isProfileComplete: Joi.boolean().optional(),
    })
    .min(1), // At least one field must be provided for an update
};

export const changePasswordSchema = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: passwordComplexity.required(),
  }),
};

export const userIdParamSchema = {
  params: Joi.object().keys({
    artistId: objectIdSchema.required(),
  }),
};
