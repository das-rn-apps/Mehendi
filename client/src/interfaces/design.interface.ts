import { type IUser } from "./user.interface";

export interface IDesignImage {
  public_id: string;
  id: string;
  url: string;
  altText?: string;
}

export interface IDesign {
  _id: string; // Add _id for frontend
  artist: IUser; // Can be ObjectId string or populated IUser
  title: string;
  description?: string;
  images: IDesignImage[];
  category?: string;
  tags?: string[];
  likesCount: number;
  isFeatured?: boolean;
  isActive: boolean;
  createdAt: string; // Dates will be strings from API
  updatedAt: string; // Dates will be strings from API
}
