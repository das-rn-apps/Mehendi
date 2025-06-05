import { create } from "zustand";
import type { IAppointmentResponse } from "../interfaces/appointment.interface";

interface AppointmentState {
  appointments: IAppointmentResponse[];
  selectedAppointment: IAppointmentResponse | null;
  loading: boolean;
  error: string | null;
}

interface AppointmentActions {
  setAppointments: (appointments: IAppointmentResponse[]) => void;
  setSelectedAppointment: (appointment: IAppointmentResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const appointmentStore = create<AppointmentState & AppointmentActions>(
  (set) => ({
    appointments: [],
    selectedAppointment: null,
    loading: false,
    error: null,

    setAppointments: (appointments) => set({ appointments }),
    setSelectedAppointment: (appointment) =>
      set({ selectedAppointment: appointment }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  })
);
