import { Response, NextFunction } from "express";
import httpStatusCodes from "http-status-codes";
import Design from "../models/design.model";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import ApiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { IRequest } from "../interfaces/request.interface";
import cloudinary from "../config/cloudinary";
import { UserRole } from "../enums/userRoles.enum";
import mongoose from "mongoose";
import pick from "../utils/pick";

// Utility to upload to Cloudinary (can be moved to a helper file)
const uploadToCloudinary = async (
  filePath: string,
  folder: string
): Promise<{ public_id: string; url: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
  });
  return { public_id: result.public_id, url: result.secure_url };
};

export const createDesign = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const artistId = req.user?._id;
    if (req.user?.role !== UserRole.ARTIST) {
      return next(
        new ApiError(
          httpStatusCodes.FORBIDDEN,
          "Only artists can create designs."
        )
      );
    }

    const { title, description, category, tags, isFeatured, isActive } =
      req.body;

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "At least one design image is required."
        )
      );
    }

    const uploadedImages = [];
    const filesToUpload = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    for (const file of filesToUpload) {
      try {
        const result = await uploadToCloudinary(
          file.path,
          `mehndi_app/designs/${artistId}`
        );
        uploadedImages.push({
          public_id: result.public_id,
          url: result.url,
          altText: title,
        }); // Add altText
      } catch (uploadError) {
        // Rollback already uploaded images for this design if any? Or log and continue?
        console.error("Cloudinary upload error for a file:", uploadError);
        // For now, we'll let it fail if one image fails. Consider more robust error handling.
        return next(
          new ApiError(
            httpStatusCodes.INTERNAL_SERVER_ERROR,
            "Failed to upload one or more images."
          )
        );
      }
    }

    if (uploadedImages.length === 0) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Image upload failed, no images were processed."
        )
      );
    }

    const design = await Design.create({
      artist: artistId,
      title,
      description,
      images: uploadedImages,
      category,
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((t: string) => t.trim())
        : [],
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true, // Default to true if not provided
      likesCount: 0,
    });

    // Add design to artist's portfolio
    await User.findByIdAndUpdate(artistId, {
      $addToSet: { portfolio: design._id },
    });

    res
      .status(httpStatusCodes.CREATED)
      .json(
        new ApiResponse(
          httpStatusCodes.CREATED,
          design,
          "Design created successfully."
        )
      );
  }
);

export const getDesignsByArtist = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { artistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(artistId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid artist ID format.")
      );
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      isActive,
    } = req.query;
    const query: any = { artist: artistId };
    if (isActive !== undefined) query.isActive = isActive === "true";

    const designs = await Design.find(query)
      .sort({ [sortBy as string]: sortOrder === "desc" ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("artist", "firstName lastName avatar");

    const totalDesigns = await Design.countDocuments(query);

    res.status(httpStatusCodes.OK).json(
      new ApiResponse(
        httpStatusCodes.OK,
        {
          designs,
          currentPage: Number(page),
          totalPages: Math.ceil(totalDesigns / Number(limit)),
          totalDesigns,
        },
        "Designs fetched successfully."
      )
    );
  }
);

export const getAllDesigns = asyncHandler(
  async (req: IRequest, res: Response) => {
    const filters = pick(req.query, [
      "artistId",
      "category",
      "isFeatured",
      "isActive",
    ]);
    const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
    const query: any = { ...filters };

    if (req.query.tags) {
      query.tags = { $in: (req.query.tags as string).split(",") };
    }
    if (req.query.keyword) {
      query.$or = [
        { title: { $regex: req.query.keyword, $options: "i" } },
        { description: { $regex: req.query.keyword, $options: "i" } },
        { category: { $regex: req.query.keyword, $options: "i" } },
        { tags: { $regex: req.query.keyword, $options: "i" } },
      ];
    }
    // Default to active designs for public listing
    if (query.isActive === undefined && req.user?.role !== UserRole.ADMIN) {
      // Admins can see inactive
      query.isActive = true;
    }

    const designs = await Design.find(query)
      .populate("artist", "firstName lastName avatar") // Populate artist details
      .sort({
        [typeof options.sortBy === "string" ? options.sortBy : "createdAt"]:
          options.sortOrder === "desc" ? -1 : 1,
      })
      .skip(
        ((parseInt(options.page as string) || 1) - 1) *
          (parseInt(options.limit as string) || 10)
      )
      .limit(parseInt(options.limit as string) || 10);

    const totalDesigns = await Design.countDocuments(query);

    res.status(httpStatusCodes.OK).json(
      new ApiResponse(
        httpStatusCodes.OK,
        {
          designs,
          currentPage: parseInt(options.page as string) || 1,
          totalPages: Math.ceil(
            totalDesigns / (parseInt(options.limit as string) || 10)
          ),
          totalDesigns,
        },
        "All designs fetched successfully."
      )
    );
  }
);

export const getDesignById = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { designId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(designId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid design ID format.")
      );
    }
    const design = await Design.findById(designId).populate(
      "artist",
      "firstName lastName avatar"
    );
    if (
      !design ||
      (!design.isActive &&
        req.user?.role !== UserRole.ADMIN &&
        req.user?._id.toString() !== design.artist._id.toString())
    ) {
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "Design not found or not active."
      );
    }
    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          design,
          "Design fetched successfully."
        )
      );
  }
);

export const updateDesign = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { designId } = req.params;
    const updates = req.body;
    const artistId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(designId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid design ID format.")
      );
    }

    const design = await Design.findById(designId);
    if (!design) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "Design not found.");
    }

    if (
      design.artist.toString() !== artistId?.toString() &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        "You are not authorized to update this design."
      );
    }

    // Prevent updating certain fields directly if needed
    delete updates.artist;
    delete updates.likesCount;
    delete updates.images; // Image updates should be handled by a separate mechanism (add/remove)

    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = (updates.tags as string)
        .split(",")
        .map((t: string) => t.trim());
    }

    Object.assign(design, updates);
    await design.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          design,
          "Design updated successfully."
        )
      );
  }
);

// Add/Remove images from a design could be separate endpoints
export const addImageToDesign = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { designId } = req.params;
    const artistId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(designId))
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid design ID.")
      );
    if (!req.file)
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "No image file provided.")
      );

    const design = await Design.findById(designId);
    if (!design)
      return next(new ApiError(httpStatusCodes.NOT_FOUND, "Design not found."));
    if (
      design.artist.toString() !== artistId?.toString() &&
      req.user?.role !== UserRole.ADMIN
    ) {
      return next(new ApiError(httpStatusCodes.FORBIDDEN, "Not authorized."));
    }

    const result = await uploadToCloudinary(
      req.file.path,
      `mehndi_app/designs/${design.artist}/${designId}`
    );
    design.images.push({
      public_id: result.public_id,
      url: result.url,
      altText: design.title,
    });
    await design.save();

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(httpStatusCodes.OK, design, "Image added successfully.")
      );
  }
);

export const removeImageFromDesign = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { designId, imagePublicId } = req.params; // Assuming imagePublicId is passed in params or body
    const artistId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(designId))
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid design ID.")
      );
    if (!imagePublicId)
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Image public ID is required."
        )
      );

    const design = await Design.findById(designId);
    if (!design)
      return next(new ApiError(httpStatusCodes.NOT_FOUND, "Design not found."));
    if (
      design.artist.toString() !== artistId?.toString() &&
      req.user?.role !== UserRole.ADMIN
    ) {
      return next(new ApiError(httpStatusCodes.FORBIDDEN, "Not authorized."));
    }

    const imageIndex = design.images.findIndex(
      (img) => img.public_id === imagePublicId
    );
    if (imageIndex === -1)
      return next(
        new ApiError(
          httpStatusCodes.NOT_FOUND,
          "Image not found in this design."
        )
      );

    try {
      await cloudinary.uploader.destroy(imagePublicId);
      design.images.splice(imageIndex, 1);
      await design.save();
      res
        .status(httpStatusCodes.OK)
        .json(
          new ApiResponse(
            httpStatusCodes.OK,
            design,
            "Image removed successfully."
          )
        );
    } catch (error) {
      console.error("Cloudinary image deletion error:", error);
      return next(
        new ApiError(
          httpStatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to delete image from cloud."
        )
      );
    }
  }
);

export const deleteDesign = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { designId } = req.params;
    const artistId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(designId)) {
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid design ID format.")
      );
    }

    const design = await Design.findById(designId);
    if (!design) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "Design not found.");
    }

    if (
      design.artist.toString() !== artistId?.toString() &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        "You are not authorized to delete this design."
      );
    }

    // Delete images from Cloudinary
    for (const image of design.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error(
          `Failed to delete image ${image.public_id} from Cloudinary:`,
          error
        );
        // Decide if you want to stop the process or just log the error
      }
    }

    await design.deleteOne();

    // Remove design from artist's portfolio
    await User.findByIdAndUpdate(design.artist, {
      $pull: { portfolio: design._id },
    });

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { id: designId },
          "Design deleted successfully."
        )
      );
  }
);

export const likeDesign = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { designId } = req.params;
    const userId = req.user?._id; // User who is liking

    if (!mongoose.Types.ObjectId.isValid(designId))
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid design ID.")
      );

    // This is a simplified like. For a full "like/unlike" system, you'd track users who liked.
    const design = await Design.findByIdAndUpdate(
      designId,
      { $inc: { likesCount: 1 } }, // Increment likes
      { new: true }
    );

    if (!design) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "Design not found.");
    }

    // Here you might add userId to a 'likedBy' array in the design document
    // and check if user already liked it to implement an unlike feature.

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          { likesCount: design.likesCount },
          "Design liked successfully."
        )
      );
  }
);
