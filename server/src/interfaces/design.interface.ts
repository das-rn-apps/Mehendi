import mongoose, { Document, Model } from "mongoose";
import { IUser } from "./user.interface"; // For populating artist details

export interface IDesignImage {
  public_id: string;
  url: string;
  altText?: string;
}

export interface IDesign {
  artist: mongoose.Types.ObjectId | IUser; // Ref to User model (artist)
  title: string;
  description?: string;
  images: IDesignImage[];
  category?: string; // e.g., Bridal, Arabic, Indo-Western
  tags?: string[];
  likesCount: number;
  // likedBy?: mongoose.Types.ObjectId[]; // If you want to track who liked
  // viewsCount: number; // If you want to track views
  isFeatured?: boolean;
  isActive: boolean; // If the design is currently visible/available
  createdAt: Date;
  updatedAt: Date;
}

export interface IDesignDocument extends IDesign, Document {}
export interface IDesignModel extends Model<IDesignDocument> {}
