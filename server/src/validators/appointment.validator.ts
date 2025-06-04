import Joi from "joi";
import { AppointmentStatus } from "../enums/appointmentStatus.enum";
import { objectIdSchema } from "./user.validator";

export const createAppointmentSchema = {
  body: Joi.object().keys({
    artist: objectIdSchema.required(),
    design: objectIdSchema.optional(),
    appointmentDate: Joi.date().iso().greater("now").required().messages({
      "date.greater": "Appointment date must be in the future.",
      "date.iso":
        "Appointment date must be a valid ISO date string (YYYY-MM-DD).",
    }),
    startTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        "string.pattern.base":
          "Start time must be in HH:MM format (e.g., 14:30).",
      }),
    durationMinutes: Joi.number().integer().min(15).optional(), // e.g., 120 for 2 hours
    serviceType: Joi.string().trim().required().min(3).max(100),
    location: Joi.object({
      address: Joi.string().trim().required().max(255),
      city: Joi.string().trim().required().max(100),
      postalCode: Joi.string().trim().max(20).optional().allow(""),
      notes: Joi.string().trim().max(255).optional().allow(""),
      coordinates: Joi.object({
        type: Joi.string().valid("Point").required(),
        coordinates: Joi.array()
          .ordered(Joi.number().required(), Joi.number().required()) // [lng, lat]
          .length(2)
          .required(),
      }).optional(),
    }).required(),

    notes: Joi.string().trim().max(1000).optional().allow(""),
    price: Joi.number().min(0).optional(), // Price might be set by artist or negotiated
  }),
};

export const updateAppointmentSchema = {
  // For user or artist to update
  params: Joi.object().keys({
    appointmentId: objectIdSchema.required(),
  }),
  body: Joi.object()
    .keys({
      appointmentDate: Joi.date().iso().greater("now").optional().messages({
        "date.greater": "Appointment date must be in the future.",
        "date.iso":
          "Appointment date must be a valid ISO date string (YYYY-MM-DD).",
      }),
      startTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
          "string.pattern.base": "Start time must be in HH:MM format.",
        }),
      durationMinutes: Joi.number().integer().min(15).optional(),
      serviceType: Joi.string().trim().min(3).max(100).optional(),
      location: Joi.object({
        address: Joi.string().trim().max(255).optional(),
        city: Joi.string().trim().max(100).optional(),
        postalCode: Joi.string().trim().max(20).optional().allow(""),
        notes: Joi.string().trim().max(255).optional().allow(""),
      }).optional(),
      notes: Joi.string().trim().max(1000).optional().allow(""),
      artistNotes: Joi.string().trim().max(1000).optional().allow(""), // Only artist can update this typically
      price: Joi.number().min(0).optional(),
      // Status changes usually have dedicated routes/controllers
    })
    .min(1),
};

export const updateAppointmentStatusSchema = {
  // Typically by artist or admin
  params: Joi.object().keys({
    appointmentId: objectIdSchema.required(),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid(...Object.values(AppointmentStatus))
      .required(),
    cancellationReasonUser: Joi.string().when("status", {
      is: AppointmentStatus.CANCELLED,
      then: Joi.string().trim().max(255).optional().allow(""), // Optional if user cancels
      otherwise: Joi.forbidden(),
    }),
    cancellationReasonArtist: Joi.string().when("status", {
      is: AppointmentStatus.CANCELLED, // Or REJECTED
      then: Joi.string().trim().max(255).optional().allow(""), // Optional if artist cancels/rejects
      otherwise: Joi.forbidden(),
    }),
    artistNotes: Joi.string().trim().max(1000).optional().allow(""), // Artist might add notes when changing status
  }),
};

export const appointmentIdParamSchema = {
  params: Joi.object().keys({
    appointmentId: objectIdSchema.required(),
  }),
};

export const appointmentQuerySchema = {
  query: Joi.object({
    userId: objectIdSchema.optional(),
    artistId: objectIdSchema.optional(),
    status: Joi.string()
      .valid(...Object.values(AppointmentStatus))
      .optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional().min(Joi.ref("dateFrom")),
    sortBy: Joi.string()
      .valid("appointmentDate", "createdAt", "status")
      .default("appointmentDate"),
    sortOrder: Joi.string().valid("asc", "desc").default("asc"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};
