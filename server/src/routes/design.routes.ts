import { Router } from "express";
import * as designController from "../controllers/design.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import validate from "../middlewares/validation.middleware";
import {
  createDesignSchema,
  updateDesignSchema,
  designIdParamSchema,
  designQuerySchema,
} from "../validators/design.validator";
import upload from "../middlewares/upload.middleware"; // For design image uploads
import { UserRole } from "../enums/userRoles.enum";
import Joi from "joi";
import { objectIdSchema } from "../validators/user.validator";

const router = Router();

// --- Public Routes for Designs ---
router.get("/", validate(designQuerySchema), designController.getAllDesigns); // List all (public/active) designs with filters
router.get(
  "/:designId",
  validate(designIdParamSchema),
  designController.getDesignById
); // Get a specific design
router.get(
  "/artist/:artistId",
  validate({ params: designIdParamSchema.params }),
  designController.getDesignsByArtist
); // Get all designs by a specific artist

// --- Authenticated User Routes (e.g., Liking a design) ---
router.post(
  "/:designId/like",
  protect,
  validate(designIdParamSchema),
  designController.likeDesign
);

// --- Artist Specific Routes for Managing Their Designs ---
router.post(
  "/",
  protect,
  authorize([UserRole.ARTIST]),
  upload.array("images", 5), // Allow up to 5 images per design, field name 'images'
  validate(createDesignSchema),
  designController.createDesign
);

router.put(
  "/:designId",
  protect,
  authorize([UserRole.ARTIST, UserRole.ADMIN]), // Admin can also update
  validate(updateDesignSchema),
  designController.updateDesign
);

router.delete(
  "/:designId",
  protect,
  authorize([UserRole.ARTIST, UserRole.ADMIN]), // Admin can also delete
  validate(designIdParamSchema),
  designController.deleteDesign
);

// Routes for managing images within a design
router.post(
  "/:designId/images",
  protect,
  authorize([UserRole.ARTIST, UserRole.ADMIN]),
  upload.single("image"), // Field name 'image'
  validate(designIdParamSchema),
  designController.addImageToDesign
);

router.delete(
  "/:designId/images/:imagePublicId", // Assuming imagePublicId is used to identify image
  protect,
  authorize([UserRole.ARTIST, UserRole.ADMIN]),
  validate({
    params: Joi.object({
      designId: objectIdSchema.required(), // ✅ Use the schema directly
      imagePublicId: Joi.string().required(),
    }),
  }),
  designController.removeImageFromDesign
);

export default router;
