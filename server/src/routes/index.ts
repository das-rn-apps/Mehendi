import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import designRoutes from "./design.routes";
import appointmentRoutes from "./appointment.routes";

const router = Router();

const defaultRoutes = [
  { path: "/auth", route: authRoutes },
  { path: "/users", route: userRoutes },
  { path: "/designs", route: designRoutes },
  { path: "/appointments", route: appointmentRoutes },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
