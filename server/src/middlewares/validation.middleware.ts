import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import httpStatusCodes from "http-status-codes";
import ApiError from "../utils/apiError";
import pick from "../utils/pick"; // You created this utility

const validate =
  (schema: Record<string, Joi.Schema>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const objectToValidate = pick(
      req,
      Object.keys(validSchema) as Array<keyof Request>
    );

    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false }) // abortEarly: false to show all errors
      .validate(objectToValidate);

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(", ");
      const errors = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path,
        type: detail.type,
      }));
      return next(
        new ApiError(httpStatusCodes.BAD_REQUEST, errorMessage, true, errors)
      );
    }

    Object.assign(req, value); // Overwrite req.body, req.params, req.query with validated values
    return next();
  };

export default validate;
