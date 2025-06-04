import { Document, Model } from "mongoose";
import { UserRole } from "../enums/userRoles.enum";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Password will be selected: false in schema
  phone?: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  isActive: boolean;
  lastLogin?: Date;
  otp?: string;
  otpExpires?: Date;
  // For artists
  bio?: string;
  portfolio?: string[]; // URLs to design images or design IDs
  availability?: {
    day: string; // e.g., 'Monday'
    startTime: string; // e.g., '09:00'
    endTime: string; // e.g., '17:00'
  }[];
  yearsOfExperience?: number;
  specializations?: string[]; // e.g., ['Bridal', 'Arabic', 'Traditional']
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  isProfileComplete?: boolean;
  refreshToken?: string;
}

// For Mongoose document (includes methods, virtuals, etc.)
export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
  // You can add any instance methods here
}

// For Mongoose model (includes static methods)
export interface IUserModel extends Model<IUserDocument> {
  // You can add any static methods here, e.g., findByEmail
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}
