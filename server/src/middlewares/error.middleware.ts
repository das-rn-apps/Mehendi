import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger";
import ApiError from "../utils/apiError";
import config from "../config";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (
  err: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;
  // Check if it's an ApiError we threw intentionally
  if (!(error instanceof ApiError)) {
    const statusCode =
      error instanceof mongoose.Error
        ? httpStatusCodes.BAD_REQUEST
        : httpStatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatusCodes.getStatusText(statusCode);
    error = new ApiError(statusCode, message, false, undefined, err.stack);
  }

  const { statusCode, message, errors, stack } = error as ApiError;

  logger.error(message, { stack: config.env === "development" ? stack : {} });

  const response = {
    code: statusCode,
    message,
    ...(errors && { errors }), // Include errors if they exist
    ...(config.env === "development" && { stack }), // Include stack trace in development
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
