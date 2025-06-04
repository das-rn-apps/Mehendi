import { Request } from "express";
import { IUserDocument } from "./user.interface";

export interface IRequest extends Request {
  user?: IUserDocument; // or any other type you use for user
  file?: Express.Multer.File; // If using multer
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}
