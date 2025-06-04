import mongoose, { Document, Model } from "mongoose";
import { AppointmentStatus } from "../enums/appointmentStatus.enum";
import { IUser } from "./user.interface"; // For populating user/artist details

export interface IAppointment {
  user: mongoose.Types.ObjectId | IUser; // Client
  artist: mongoose.Types.ObjectId | IUser; // Mehendi Artist
  design?: mongoose.Types.ObjectId; // Optional: Ref to Design model
  appointmentDate: Date;
  startTime: string; // e.g., "14:00"
  endTime?: string; // e.g., "16:00"
  durationMinutes?: number; // e.g., 120 minutes
  serviceType: string; // e.g., "Bridal Mehendi", "Party Mehendi"
  location: {
    address: string;
    city: string;
    postalCode?: string;
    notes?: string; // e.g., "Ring bell for unit 5"
    coordinates?: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  notes?: string; // Special requests from user
  artistNotes?: string; // Notes from artist for the appointment
  price?: number;
  priceBreakdown?: { item: string; amount: number }[]; // For detailed pricing
  status: AppointmentStatus;
  paymentDetails?: {
    transactionId?: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod?: string;
    amountPaid?: number;
  };
  cancellationReason?: string;
  rescheduledFrom?: mongoose.Types.ObjectId; // If this appointment is a reschedule
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentDocument extends IAppointment, Document {}

export interface IAppointmentModel extends Model<IAppointmentDocument> {}
