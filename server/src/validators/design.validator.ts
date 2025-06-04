import Joi from "joi";
import { objectIdSchema } from "./user.validator"; // Re-use ObjectId schema

export const createDesignSchema = {
  body: Joi.object().keys({
    title: Joi.string().trim().required().min(3).max(100),
    description: Joi.string().trim().max(1000).optional().allow(""),
    // images will be handled by multer, paths/ids will be added by controller
    category: Joi.string().trim().max(50).optional(),
    tags: Joi.array()
      .items(Joi.string().trim().lowercase().max(30))
      .optional()
      .max(10),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().default(true),
  }),
};

export const updateDesignSchema = {
  params: Joi.object().keys({
    designId: objectIdSchema.required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim().min(3).max(100).optional(),
      description: Joi.string().trim().max(1000).optional().allow(""),
      category: Joi.string().trim().max(50).optional(),
      tags: Joi.array()
        .items(Joi.string().trim().lowercase().max(30))
        .optional()
        .max(10),
      // For updating images, you might have a separate endpoint or logic to add/remove images
      isFeatured: Joi.boolean().optional(),
      isActive: Joi.boolean().optional(),
    })
    .min(1),
};

export const designIdParamSchema = {
  params: Joi.object().keys({
    designId: objectIdSchema.required(),
  }),
};

export const designQuerySchema = {
  query: Joi.object({
    artistId: objectIdSchema.optional(),
    category: Joi.string().trim().optional(),
    tags: Joi.string().trim().optional(), // comma-separated tags
    keyword: Joi.string().trim().optional(),
    sortBy: Joi.string()
      .valid("createdAt", "likesCount", "title")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional().default(true),
  }),
};
