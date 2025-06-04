import { Router } from "express";
import * as appointmentController from "../controllers/appointment.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import validate from "../middlewares/validation.middleware";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentIdParamSchema,
  appointmentQuerySchema,
} from "../validators/appointment.validator";
import { UserRole } from "../enums/userRoles.enum";

const router = Router();

router.use(protect); // All appointment routes require authentication

// Create a new appointment (User role)
router.post(
  "/",
  authorize([UserRole.USER, UserRole.ADMIN, UserRole.ARTIST]), // Admin can book for a user too
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

// Get appointments (for logged-in user: client or artist, or admin can filter)
router.get(
  "/",
  validate(appointmentQuerySchema),
  appointmentController.getMyAppointments
);

// Get a specific appointment by ID
router.get(
  "/:appointmentId",
  validate(appointmentIdParamSchema),
  appointmentController.getAppointmentById
);

// Update appointment details (e.g., notes, time - by user or artist, if status allows)
router.put(
  "/:appointmentId/details",
  validate(updateAppointmentSchema), // Re-using updateAppointmentSchema, ensure it fits
  appointmentController.updateAppointmentDetails
);

// Update appointment status (typically by artist or admin; user can cancel via this too)
router.patch(
  // Using PATCH for partial update like status change
  "/:appointmentId/status",
  validate(updateAppointmentStatusSchema),
  appointmentController.updateAppointmentStatus
);

// --- Admin specific appointment routes ---
router.get(
  "/admin/all", // A specific route for admins to get all appointments with more filters
  authorize([UserRole.ADMIN]),
  validate(appointmentQuerySchema), // Use a potentially more comprehensive admin query schema if needed
  appointmentController.getAllAppointmentsAdmin
);

// Admin could also have routes to delete or forcefully modify appointments if necessary.
// router.delete(
//   '/:appointmentId/admin',
//   authorize([UserRole.ADMIN]),
//   validate(appointmentIdParamSchema),
//   appointmentController.deleteAppointmentByAdmin // You would create this controller
// );

export default router;
