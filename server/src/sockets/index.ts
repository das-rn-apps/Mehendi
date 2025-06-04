import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "../utils/logger";
import config from "../config";
import jwt from "jsonwebtoken";
import {
  initializeNotificationService,
  getNotificationService,
  NotificationService,
} from "../services/notification.service";
// import appointmentSocketHandler from './appointment.socket'; // Example for specific event handlers

interface SocketUser {
  // Define the structure of the user object you'll attach to the socket
  id: string;
  role: string;
  // Add other relevant user properties
}

// Extend the Socket interface to include the user property
export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigin, // Your frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
    // path: "/my-custom-path/" // If you want to serve socket.io on a custom path
  });

  // Initialize the notification service with the io instance
  const notificationService = initializeNotificationService(io);

  // Socket.IO Middleware for Authentication (example)
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers["x-socket-token"];

    if (!token) {
      logger.warn("Socket connection attempt without token.");
      return next(new Error("Authentication error: Token not provided."));
    }
    try {
      // Verify the token (this should be your access token, or a dedicated socket token)
      const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
      if (typeof decoded.sub !== "string" || !decoded.role) {
        return next(new Error("Authentication error: Invalid token payload."));
      }
      // You might want to fetch minimal user details here if needed
      // For now, just attach basic info from the token
      socket.user = { id: decoded.sub, role: decoded.role as string };
      logger.info(
        `Socket authenticated for user: ${socket.user.id}, role: ${socket.user.role}`
      );
      next();
    } catch (err) {
      logger.error("Socket authentication error:", err);
      next(new Error("Authentication error: Invalid token."));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    logger.info(
      `New client connected: ${socket.id}, User ID: ${socket.user?.id}`
    );

    if (socket.user) {
      notificationService.registerUserSocket(socket.user.id, socket.id);
      socket.join(socket.user.id); // User joins a room named by their ID (for direct messages)
      if (socket.user.role === "artist") {
        socket.join("artists"); // Artists join a common 'artists' room
      }
    }

    socket.on("disconnect", (reason) => {
      logger.info(
        `Client disconnected: ${socket.id}, User ID: ${socket.user?.id}. Reason: ${reason}`
      );
      if (socket.user) {
        notificationService.unregisterUserSocket(socket.user.id);
      }
    });

    socket.on("error", (error) => {
      logger.error(
        `Socket error for ${socket.id}, User ID: ${socket.user?.id}:`,
        error
      );
    });

    // --- Register your custom event handlers here ---
    // appointmentSocketHandler(io, socket, notificationService);

    // Example: Join a room based on appointment ID
    socket.on("join_appointment_room", (appointmentId: string) => {
      if (socket.user) {
        // Ensure user is authenticated
        // TODO: Add logic here to verify if the user is authorized to join this room
        // e.g., check if the user is the client or the artist for this appointment
        socket.join(appointmentId);
        logger.info(
          `User ${socket.user.id} joined room for appointment ${appointmentId}`
        );
        socket.emit("room_joined", `Successfully joined room ${appointmentId}`);
      } else {
        socket.emit(
          "error_joining_room",
          "Authentication required to join room."
        );
      }
    });

    // Example: Send a message to an appointment room
    socket.on(
      "send_message_to_appointment_room",
      (data: { appointmentId: string; message: string }) => {
        if (socket.user) {
          // TODO: Verify user is part of this appointment room before emitting
          logger.info(
            `Message from ${socket.user.id} to room ${data.appointmentId}: ${data.message}`
          );
          // Emit to all in room including sender: io.to(data.appointmentId).emit(...)
          // Emit to all in room except sender:
          socket.to(data.appointmentId).emit("new_message_in_room", {
            senderId: socket.user.id,
            senderRole: socket.user.role,
            message: data.message,
            timestamp: new Date(),
          });
        }
      }
    );

    // More specific event handlers can be modularized
    // Example: if you had `src/sockets/appointment.socket.ts`
    // appointmentHandlers(io, socket);

    // Test event
    socket.on("client_ping", () => {
      logger.info(`Received ping from ${socket.user?.id || socket.id}`);
      socket.emit("server_pong", { timestamp: new Date() });
    });
  });

  logger.info("Socket.IO server initialized and listening for connections 📡");
  return io;
};
