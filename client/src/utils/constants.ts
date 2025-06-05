export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const LOCAL_STORAGE_TOKEN_KEY = "mehendi_app_token";
export const LOCAL_STORAGE_USER_KEY = "mehendi_app_user";

export const USER_ROLES = {
  CLIENT: "client",
  ARTIST: "artist",
  ADMIN: "admin",
};

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
};
