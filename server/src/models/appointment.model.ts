import mongoose, { Schema, Document, Model } from "mongoose";
import { AppointmentStatus } from "../enums/appointmentStatus.enum";

export interface IAppointment {
  user: mongoose.Types.ObjectId; // Ref to User model (client)
  artist: mongoose.Types.ObjectId; // Ref to User model (artist)
  design?: mongoose.Types.ObjectId; // Optional: Ref to Design model if a specific design is chosen
  appointmentDate: Date;
  startTime: string; // e.g., "14:00"
  endTime?: string; // e.g., "16:00" (can be calculated based on duration)
  durationMinutes?: number; // e.g., 120 minutes
  serviceType: string; // e.g., "Bridal Mehendi", "Party Mehendi"
  location: {
    // Can be client's location or artist's studio
    address: string;
    city: string;
    postalCode?: string;
    coordinates?: {
      // Optional: for map integration
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  notes?: string; // Special requests from user
  artistNotes?: string; // Notes from artist
  price?: number;
  status: AppointmentStatus;
  paymentDetails?: {
    // Basic payment tracking
    transactionId?: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod?: string;
  };
  cancellationReason?: string;
  rescheduledFrom?: mongoose.Types.ObjectId; // If this appointment is a reschedule of another
}

export interface IAppointmentDocument extends IAppointment, Document {}
export interface IAppointmentModel extends Model<IAppointmentDocument> {}

const appointmentSchema = new Schema<IAppointmentDocument, IAppointmentModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    artist: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    design: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: false,
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    startTime: {
      type: String, // Store as "HH:MM"
      required: [true, "Start time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format. Use HH:MM",
      ],
    },
    endTime: {
      type: String,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format. Use HH:MM",
      ],
    },
    durationMinutes: {
      type: Number, // Duration in minutes
      min: 15, // Minimum 15 minutes
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      trim: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: undefined },
        coordinates: { type: [Number], default: undefined }, // [longitude, latitude]
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    artistNotes: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
      index: true,
    },
    paymentDetails: {
      transactionId: String,
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paymentMethod: String,
    },
    cancellationReason: String,
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient querying of appointments for a user or artist by date
appointmentSchema.index({ user: 1, appointmentDate: -1 });
appointmentSchema.index({ artist: 1, appointmentDate: -1 });
appointmentSchema.index({ "location.coordinates": "2dsphere" });

// Virtual to combine date and time for easier sorting/comparison if needed
appointmentSchema.virtual("appointmentDateTime").get(function () {
  if (this.appointmentDate && this.startTime) {
    const [hours, minutes] = this.startTime.split(":").map(Number);
    const date = new Date(this.appointmentDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return null;
});

// Pre-save hook to calculate endTime if duration is provided
appointmentSchema.pre<IAppointmentDocument>("save", function (next) {
  if (this.isModified("startTime") || this.isModified("durationMinutes")) {
    if (this.startTime && this.durationMinutes) {
      const [hours, minutes] = this.startTime.split(":").map(Number);
      const startDate = new Date(); // Temporary date object
      startDate.setHours(hours, minutes, 0, 0);
      startDate.setMinutes(startDate.getMinutes() + this.durationMinutes);
      this.endTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(
        startDate.getMinutes()
      ).padStart(2, "0")}`;
    }
  }
  next();
});

const Appointment = mongoose.model<IAppointmentDocument, IAppointmentModel>(
  "Appointment",
  appointmentSchema
);

export default Appointment;
