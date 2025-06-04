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
  user_id: string;
  role: UserRole;
  iat: number; // Issued at
  exp: number; // Expiration time
  type: string;
}

export const protect = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      console.log("No token found in request headers or cookies");
      return next(
        new ApiError(httpStatusCodes.UNAUTHORIZED, "Not authorized, no token")
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError);
      return next(
        new ApiError(
          httpStatusCodes.UNAUTHORIZED,
          "Not authorized, token failed"
        )
      );
    }

    const currentUser = await User.findById(decoded.user_id).select(
      "-password"
    );

    if (!currentUser) {
      console.error("User not found for decoded _id:", decoded.user_id);
      return next(new ApiError(httpStatusCodes.UNAUTHORIZED, "User not found"));
    }

    req.user = currentUser as IUserDocument;
    next();
  } catch (error) {
    console.error("Unexpected error in protect middleware:", error);
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (roles: UserRole[]) => {
  return (req: IRequest, res: Response, next: NextFunction) => {
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
