import { Response, NextFunction } from "express";
import httpStatusCodes from "http-status-codes";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import ApiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { IRequest } from "../interfaces/request.interface";
import { UserRole } from "../enums/userRoles.enum";
import cloudinary from "../config/cloudinary"; // For avatar uploads
import Design from "../models/design.model"; // If artist profile includes designs
import Appointment from "../models/appointment.model"; // If user profile includes appointments
import mongoose from "mongoose";
import pick from "../utils/pick";

// Utility to upload to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  folder: string
): Promise<{ public_id: string; url: string }> => {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return { public_id: result.public_id, url: result.secure_url };
};

// === User Profile (for the logged-in user) ===
export const getMyProfile = asyncHandler(
  async (req: IRequest, res: Response) => {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate("portfolio"); // Populate designs if artist

    if (!user) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "User profile not found.");
    }
    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          user,
          "Profile fetched successfully."
        )
      );
  }
);

export const updateMyProfile = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const updates = req.body;

    // Users cannot change their email, role, or isActive status via this route.
    const forbiddenUpdates = [
      "email",
      "role",
      "isActive",
      "isEmailVerified",
      "password",
    ];
    for (const key of forbiddenUpdates) {
      if (updates[key]) {
        return next(
          new ApiError(
            httpStatusCodes.BAD_REQUEST,
            `Cannot update '${key}' field.`
          )
        );
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
    }

    // Handle artist-specific profile completeness
    if (user.role === UserRole.ARTIST) {
      if (
        updates.bio &&
        updates.availability &&
        updates.specializations &&
        updates.location?.address
      ) {
        updates.isProfileComplete = true;
      } else if (
        Object.keys(updates).some((key) =>
          ["bio", "availability", "specializations", "location"].includes(key)
        )
      ) {
        // If any key artist profile field is updated, re-evaluate completeness
        const currentBio = updates.bio || user.bio;
        const currentAvail = updates.availability || user.availability;
        const currentSpecs = updates.specializations || user.specializations;
        const currentLoc = updates.location?.address || user.location?.address;
        user.isProfileComplete = !!(
          currentBio &&
          currentAvail &&
          currentAvail.length > 0 &&
          currentSpecs &&
          currentSpecs.length > 0 &&
          currentLoc
        );
      }
    }

    Object.assign(user, updates);
    await user.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          user,
          "Profile updated successfully."
        )
      );
  }
);

export const uploadMyAvatar = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
    }
    if (!req.file) {
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "No avatar image file provided."
      );
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      } catch (error) {
        // Log error but don't fail the request
        console.error("Failed to delete old avatar:", error);
      }
    }

    const result = await uploadToCloudinary(
      req.file.path,
      `mehndi_app/avatars/${userId}`
    );
    user.avatar = { public_id: result.public_id, url: result.url };
    await user.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { avatar: user.avatar },
          "Avatar uploaded successfully."
        )
      );
  }
);

export const changeMyPassword = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new ApiError(
        httpStatusCodes.UNAUTHORIZED,
        "Incorrect current password."
      );
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          {},
          "Password changed successfully."
        )
      );
  }
);

// === Admin User Management (Example) ===
export const getAllUsers = asyncHandler(
  async (req: IRequest, res: Response) => {
    // Add pagination, filtering, sorting
    const filter = pick(req.query, ["role", "isActive", "isEmailVerified"]);
    const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
    // Basic search
    if (req.query.search) {
      // @ts-ignore
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // @ts-ignore
    const users = await User.find(filter)
      .sort({
        [typeof options.sortBy === "string" ? options.sortBy : "createdAt"]:
          options.sortOrder === "desc" ? -1 : 1,
      })
      .skip(
        ((parseInt(options.page as string) || 1) - 1) *
          (parseInt(options.limit as string) || 10)
      )
      .limit(parseInt(options.limit as string) || 10);

    const totalResults = await User.countDocuments(filter);

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { users, totalResults },
          "Users fetched successfully."
        )
      );
  }
);

export const getUserById = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid user ID format.")
      );
    }
    const user = await User.findById(userId).populate("portfolio"); // Populate designs if artist
    if (!user) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
    }
    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(httpStatusCodes.OK, user, "User fetched successfully.")
      );
  }
);

// Admin can update any user's profile (more fields than user self-update)
export const updateUserById = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid user ID format.")
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
    }

    // Admin cannot directly change password here, should be a separate "reset password for user" flow
    if (updates.password) {
      delete updates.password;
    }

    Object.assign(user, updates);
    await user.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          user,
          "User updated successfully by admin."
        )
      );
  }
);

export const deleteUserById = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid user ID format.")
      );
    }
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
    }
    // Consider what to do with related data (designs, appointments) - soft delete or cascade?
    // e.g., await Design.deleteMany({ artist: userId });
    //       await Appointment.deleteMany({ $or: [{ user: userId }, { artist: userId }] });
    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { id: userId },
          "User deleted successfully."
        )
      );
  }
);

// --- Publicly accessible artist profiles ---
export const getArtistPublicProfile = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { artistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(artistId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid artist ID format.")
      );
    }

    const artist = await User.findOne({
      _id: artistId,
      role: UserRole.ARTIST,
      isActive: true,
      isProfileComplete: true,
    })
      .select(
        "-password -otp -otpExpires -refreshToken -isEmailVerified -isPhoneVerified -lastLogin -email"
      ) // Select fields for public view
      .populate({
        path: "portfolio", // Assuming 'portfolio' stores Design IDs
        match: { isActive: true }, // Only active designs
        select: "title images category likesCount", // Select specific fields from Design
        options: { limit: 10, sort: { createdAt: -1 } }, // Paginate designs if many
      });

    if (!artist) {
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "Artist not found or profile is not public."
      );
    }

    // You might want to fetch reviews/ratings separately
    // const reviews = await Review.find({ artist: artistId, isApproved: true });

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { artist /*, reviews */ },
          "Artist profile fetched successfully."
        )
      );
  }
);

// --- List artists (publicly accessible, for Browse) ---
export const listPublicArtists = asyncHandler(
  async (req: IRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      specializations,
      city,
      search,
    } = req.query;

    const query: any = {
      role: UserRole.ARTIST,
      isActive: true,
      isProfileComplete: true,
    };

    if (specializations) {
      query.specializations = { $in: (specializations as string).split(",") };
    }
    if (city) {
      query["location.address"] = { $regex: city, $options: "i" }; // Simple city search in address
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { specializations: { $regex: search, $options: "i" } },
      ];
    }

    const artists = await User.find(query)
      .select(
        "firstName lastName avatar bio specializations location.address yearsOfExperience"
      ) // Public fields
      .sort({ [sortBy as string]: sortOrder === "desc" ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalArtists = await User.countDocuments(query);

    res.status(httpStatusCodes.OK).json(
      new ApiResponse(
        httpStatusCodes.OK,
        {
          artists,
          currentPage: Number(page),
          totalPages: Math.ceil(totalArtists / Number(limit)),
          totalArtists,
        },
        "Artists listed successfully."
      )
    );
  }
);
