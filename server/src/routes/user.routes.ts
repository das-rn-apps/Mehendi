import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import validate from "../middlewares/validation.middleware";
import {
  updateUserSchema,
  changePasswordSchema,
  userIdParamSchema,
  createUserSchema, // For admin
} from "../validators/user.validator";
import upload from "../middlewares/upload.middleware"; // For avatar uploads
import { UserRole } from "../enums/userRoles.enum";

const router = Router();

// --- Publicly accessible artist routes ---
router.get("/artists/public", userController.listPublicArtists); // List all public artists
router.get(
  "/artists/public/:artistId",
  validate(userIdParamSchema),
  userController.getArtistPublicProfile
); // Get specific public artist profile

// --- Authenticated User Routes (for their own profile) ---
router.use(protect); // All routes below this require authentication

router.get("/me", userController.getMyProfile);
router.put("/me", validate(updateUserSchema), userController.updateMyProfile);
router.post(
  "/me/avatar",
  upload.single("avatar"),
  userController.uploadMyAvatar
);
router.post(
  "/me/change-password",
  validate(changePasswordSchema),
  userController.changeMyPassword
);

// --- Admin Routes for User Management ---
// These routes require ADMIN role
router.get(
  "/", // GET /api/v1/users
  authorize([UserRole.ADMIN]),
  userController.getAllUsers
);
router.post(
  "/", // POST /api/v1/users
  authorize([UserRole.ADMIN]),
  validate(createUserSchema),
  userController.getAllUsers // Should be userController.createUser
);

router.get(
  "/:userId", // GET /api/v1/users/:userId
  authorize([UserRole.ADMIN]),
  validate(userIdParamSchema),
  userController.getUserById
);
router.put(
  "/:userId", // PUT /api/v1/users/:userId
  authorize([UserRole.ADMIN]),
  validate(userIdParamSchema), // Validate userId in param
  validate(updateUserSchema), // Validate body (admin might have slightly different update schema)
  userController.updateUserById
);
router.delete(
  "/:userId", // DELETE /api/v1/users/:userId
  authorize([UserRole.ADMIN]),
  validate(userIdParamSchema),
  userController.deleteUserById
);

export default router;
