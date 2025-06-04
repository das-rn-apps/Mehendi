import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import httpStatusCodes from "http-status-codes";
import config from "../config";
import ApiError from "../utils/apiError";
import { IRequest } from "../interfaces/request.interface";
import User from "../models/user.model";
import { UserRole } from "@/enums/userRoles.enum";
import { IUserDocument } from "@/interfaces/user.interface";

interface JwtPayload {
  _id: string;
  role: UserRole;
  // Add any additional claims if needed
}

export const protect = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader);

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    console.log("Extracted Token:", token);

    if (!token) {
      console.log("No token found in request headers or cookies");
      return next(
        new ApiError(httpStatusCodes.UNAUTHORIZED, "Not authorized, no token")
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      console.log("Decoded Token:", decoded);
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError);
      return next(
        new ApiError(
          httpStatusCodes.UNAUTHORIZED,
          "Not authorized, token failed"
        )
      );
    }

    const currentUser = await User.findById(decoded._id).select("-password");

    if (!currentUser) {
      console.error("User not found for decoded _id:", decoded._id);
      return next(new ApiError(httpStatusCodes.UNAUTHORIZED, "User not found"));
    }

    req.user = currentUser as IUserDocument;
    console.log("Authenticated User:", req.user.email);
    next();
  } catch (error) {
    console.error("Unexpected error in protect middleware:", error);
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (roles: UserRole[]) => {
  return (req: IRequest, res: Response, next: NextFunction) => {
    console.log("Authorize Middleware - User Role:", req.user?.role);

    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      return next(
        new ApiError(
          httpStatusCodes.FORBIDDEN,
          `User role ${req.user?.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};
