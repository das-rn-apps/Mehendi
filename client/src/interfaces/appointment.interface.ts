import { type IUser } from "./user.interface";
import { type IDesign } from "./design.interface";

// Change from enum to a union of string literals
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rescheduled";

export interface IAppointment {
  _id: string; // Add _id for frontend
  user: IUser | string;
  artist: IUser | string;
  design?: string | IDesign;
  appointmentDate: string; // Date string
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  serviceType: string;
  location: {
    address: string;
    city: string;
    postalCode?: string;
    notes?: string;
    coordinates?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  notes?: string;
  artistNotes?: string;
  price?: number;
  priceBreakdown?: { item: string; amount: number }[];
  status: AppointmentStatus; // Use the new type here
  paymentDetails?: {
    transactionId?: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod?: string;
    amountPaid?: number;
  };
  cancellationReason?: string;
  rescheduledFrom?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAppointmentResponse {
  _id: string; // Add _id for frontend
  user: IUser;
  artist: IUser;
  design?: IDesign;
  appointmentDate: string; // Date string
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  serviceType: string;
  location: {
    address: string;
    city: string;
    postalCode?: string;
    notes?: string;
    coordinates?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  notes?: string;
  artistNotes?: string;
  price?: number;
  priceBreakdown?: { item: string; amount: number }[];
  status: AppointmentStatus; // Use the new type here
  paymentDetails?: {
    transactionId?: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod?: string;
    amountPaid?: number;
  };
  cancellationReason?: string;
  rescheduledFrom?: string;
  createdAt: string;
  updatedAt: string;
}
