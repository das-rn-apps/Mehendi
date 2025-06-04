import { Server as SocketIOServer } from "socket.io";
import logger from "../utils/logger";
import { AuthenticatedSocket } from "./index"; // Your extended socket with .user
import { NotificationService } from "../services/notification.service";

interface AppointmentActionPayload {
  appointmentId: string;
  clientId: string;
}

interface CancelAppointmentPayload {
  appointmentId: string;
  clientId: string;
  artistId: string;
}

export default function appointmentSocketHandler(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  notificationService: NotificationService
) {
  if (!socket.user) {
    socket.emit("unauthorized", { message: "User not authenticated." });
    return;
  }

  const user = socket.user;

  // ✅ Artist confirms appointment
  socket.on(
    "artist_confirm_appointment",
    async (data: AppointmentActionPayload) => {
      if (user.role !== "artist") {
        socket.emit("appointment_action_error", {
          message: "Only artists can confirm appointments.",
        });
        return;
      }

      try {
        // Simulate DB update (replace with real DB logic)
        // const updated = await Appointment.findByIdAndUpdate(...);

        logger.info(
          `Artist ${user.id} confirmed appointment ${data.appointmentId} for client ${data.clientId}`
        );

        // Notify the client
        notificationService.sendNotificationToUser(
          data.clientId,
          "appointment_confirmed",
          {
            appointmentId: data.appointmentId,
            message: `Your appointment has been confirmed by the artist.`,
          }
        );

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

  // ✅ User cancels appointment
  socket.on(
    "user_cancel_appointment",
    async (data: CancelAppointmentPayload) => {
      if (user.role !== "user" || user.id !== data.clientId) {
        socket.emit("appointment_action_error", {
          message: "Unauthorized to cancel this appointment.",
        });
        return;
      }

      try {
        logger.info(
          `User ${user.id} cancelled appointment ${data.appointmentId} with artist ${data.artistId}`
        );

        notificationService.sendNotificationToUser(
          data.artistId,
          "appointment_cancelled_by_user",
          {
            appointmentId: data.appointmentId,
            message: `The user has cancelled appointment ID: ${data.appointmentId}.`,
          }
        );

        socket.emit("appointment_cancellation_success", {
          appointmentId: data.appointmentId,
        });
      } catch (error: any) {
        logger.error(
          `Error cancelling appointment ${data.appointmentId}:`,
          error
        );
        socket.emit("appointment_action_error", {
          message: error.message || "Failed to cancel appointment.",
        });
      }
    }
  );

  // 🟡 TODO: Add more events
  // - artist_reject_appointment
  // - artist_mark_appointment_completed
  // - chat_message_for_appointment
}
