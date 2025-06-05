import api from "./api";
import {
  type IAppointment,
  type IAppointmentResponse,
} from "../interfaces/appointment.interface";

export const createAppointment = async (
  appointmentData: Partial<IAppointment>
): Promise<IAppointment> => {
  const response = await api.post("/appointments", appointmentData);
  return response.data.appointment;
};

export const getMyAppointments = async (): Promise<IAppointmentResponse[]> => {
  const response = await api.get("/appointments");
  return response.data.data.appointments;
};

export const getArtistAppointments = async (
  artistId: string
): Promise<IAppointment[]> => {
  const response = await api.get(`/appointments/artist/${artistId}`);
  return response.data.appointments;
};

export const getAppointmentById = async (id: string): Promise<IAppointment> => {
  const response = await api.get(`/appointments/${id}`);
  return response.data.appointment;
};

export const updateAppointmentStatus = async (
  id: string,
  status: string
): Promise<IAppointment> => {
  const response = await api.patch(`/appointments/${id}/status`, { status });
  return response.data.appointment;
};

export const cancelAppointment = async (
  id: string,
  reason: string
): Promise<IAppointment> => {
  const response = await api.patch(`/appointments/${id}/cancel`, { reason });
  return response.data.appointment;
};
