// Change from enum to a union of string literals
export type UserRole = "client" | "artist" | "admin";

export interface IUser {
  _id: string; // Add _id for frontend
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  role: UserRole; // Use the new type here
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  isActive: boolean;
  lastLogin?: Date;
  bio?: string;
  portfolio?: string[];
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  yearsOfExperience?: number;
  specializations?: string[];
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  isProfileComplete?: boolean;
}
