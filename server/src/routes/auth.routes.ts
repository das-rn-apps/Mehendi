import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import validate from "../middlewares/validation.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validators/auth.validator";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", protect, authController.logout); // Requires user to be logged in to logout
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshTokens
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
); // Token in query, new pass in body

router.get(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail
); // Token in query

router.post(
  "/send-otp",
  validate(sendOtpSchema),
  authController.sendVerificationOtp
);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);

router.get("/me", protect, authController.getCurrentUser);

export default router;
