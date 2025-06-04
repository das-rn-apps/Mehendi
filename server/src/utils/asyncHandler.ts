import { Request, Response, NextFunction } from "express";
import { IRequest } from "../interfaces/request.interface"; // Use your custom IRequest

type AsyncRequestHandler = (
  req: IRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (requestHandler: AsyncRequestHandler) => {
  return (req: IRequest, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
