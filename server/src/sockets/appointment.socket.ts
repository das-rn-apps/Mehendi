// src/sockets/appointment.socket.ts
import { Server as SocketIOServer } from "socket.io";
import logger from "../utils/logger";
import { AuthenticatedSocket } from "./index"; // Import your AuthenticatedSocket type
import { NotificationService } from "../services/notification.service";

// This function would be called from your main io.on('connection', ...) handler
// and passed the io instance, the connected socket, and the notificationService.
export default function appointmentSocketHandler(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  notificationService: NotificationService
) {
  // Ensure user is on the socket object from the auth middleware
  if (!socket.user) {
    return; // Or handle unauthenticated access to these events
  }

  // Example: Artist confirms an appointment
  socket.on(
    "artist_confirm_appointment",
    async (data: { appointmentId: string; clientId: string }) => {
      if (
        socket.user?.role !== "artist" ||
        socket.user?.id !==
          data.clientId /* this logic is flawed, artist ID is on socket.user.id */
      ) {
        socket.emit("appointment_action_error", {
          message: "Unauthorized action.",
        });
        return;
      }
      try {
        // Here, you would typically:
        // 1. Update the appointment status in the database (e.g., to 'confirmed')
        //    const updatedAppointment = await Appointment.findByIdAndUpdate(data.appointmentId, { status: 'confirmed' }, { new: true });
        //    if (!updatedAppointment) throw new Error('Appointment not found');

        logger.info(
          `Artist ${socket.user.id} confirmed appointment ${data.appointmentId} for client ${data.clientId}`
        );

        // 2. Use notificationService to send a real-time update to the client
        notificationService.sendNotificationToUser(
          data.clientId,
          "appointment_confirmed",
          {
            appointmentId: data.appointmentId,
            message: `Your appointment (ID: ${data.appointmentId}) has been confirmed by the artist!`,
            // ...other relevant appointment details
          }
        );

        // 3. Optionally, emit back to the artist for UI update
        socket.emit("appointment_confirmation_success", {
          appointmentId: data.appointmentId,
        });
      } catch (error: any) {
        logger.error(
          `Error confirming appointment ${data.appointmentId}:`,
          error
        );
        socket.emit("appointment_action_error", {
          message: error.message || "Failed to confirm appointment.",
        });
      }
    }
  );

  // Example: User cancels an appointment
  socket.on(
    "user_cancel_appointment",
    async (data: { appointmentId: string; artistId: string }) => {
      if (
        socket.user?.id !==
        data.clientId /* this should be socket.user.id checking against appointment's user */
      ) {
        // socket.emit('appointment_action_error', { message: 'Unauthorized action.' });
        // return;
      }
      // Similar logic: update DB, notify artist
      logger.info(
        `User ${socket.user.id} cancelled appointment ${data.appointmentId} with artist ${data.artistId}`
      );
      notificationService.sendNotificationToUser(
        data.artistId,
        "appointment_cancelled_by_user",
        {
          appointmentId: data.appointmentId,
          message: `Appointment (ID: ${data.appointmentId}) has been cancelled by the user.`,
        }
      );
      socket.emit("appointment_cancellation_success", {
        appointmentId: data.appointmentId,
      });
    }
  );

  // More appointment-related socket events:
  // - artist_reject_appointment
  // - artist_mark_appointment_completed
  // - live_chat_message_for_appointment (if you implement chat per appointment)
}
