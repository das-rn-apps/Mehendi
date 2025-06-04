import multer from "multer";
import path from "path";
import ApiError from "../utils/apiError";
import httpStatusCodes from "http-status-codes";

// Configure multer storage (memory storage is good for temporary storage before uploading to Cloudinary)
const storage = multer.memoryStorage();

// File filter to allow only specific image types
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Invalid file type. Only JPG, PNG, GIF, WEBP files are allowed."
      )
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB file size limit
  },
});

export default upload;
