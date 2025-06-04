import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "../utils/logger";

// This service might not directly manage the socket server instance itself,
// but rather provide methods that can be called from controllers/services
// to emit events. The Socket.IO server instance would be managed in server.ts or sockets/index.ts.

// A simple in-memory store for user sockets if needed (for direct messaging etc.)
// In a larger application, you might use Redis for this.
const userSockets = new Map<string, string>(); // Map<userId, socketId>

export class NotificationService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    logger.info("NotificationService initialized with Socket.IO server 🔔");
  }

  public registerUserSocket(userId: string, socketId: string): void {
    userSockets.set(userId, socketId);
    logger.info(`User ${userId} connected with socket ${socketId}`);
  }

  public unregisterUserSocket(userId: string): void {
    userSockets.delete(userId);
    logger.info(`User ${userId} disconnected`);
  }

  public sendNotificationToUser(
    userId: string,
    event: string,
    data: any
  ): boolean {
    const socketId = userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.info(
        `Sent notification "${event}" to user ${userId} (socket ${socketId})`
      );
      return true;
    }
    logger.warn(
      `User ${userId} not connected, cannot send notification "${event}"`
    );
    return false;
  }

  public broadcastNotification(event: string, data: any, room?: string): void {
    if (room) {
      this.io.to(room).emit(event, data);
      logger.info(`Broadcasted notification "${event}" to room ${room}`);
    } else {
      this.io.emit(event, data);
      logger.info(
        `Broadcasted notification "${event}" to all connected clients`
      );
    }
  }

  // Specific notification types
  public notifyAppointmentUpdate(
    userId: string,
    appointmentDetails: any
  ): void {
    this.sendNotificationToUser(
      userId,
      "appointment_updated",
      appointmentDetails
    );
  }

  public notifyNewAppointmentRequestToArtist(
    artistId: string,
    requestDetails: any
  ): void {
    this.sendNotificationToUser(
      artistId,
      "new_appointment_request",
      requestDetails
    );
  }
}

// Global instance, to be initialized in server.ts after Socket.IO server is created.
// This is a common pattern, but dependency injection or context passing might be preferred in complex apps.
let notificationServiceInstance: NotificationService | null = null;

export const initializeNotificationService = (io: SocketIOServer) => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService(io);
  }
  return notificationServiceInstance;
};

export const getNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    throw new Error(
      "NotificationService not initialized. Call initializeNotificationService first."
    );
  }
  return notificationServiceInstance;
};
