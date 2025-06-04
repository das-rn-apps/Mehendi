import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan"; // HTTP request logger
import cookieParser from "cookie-parser";
import httpStatusCodes from "http-status-codes";
import config from "./config";
import logger from "./utils/logger";
import apiRoutes from "./routes/index";
import errorHandler from "./middlewares/error.middleware";
import ApiError from "./utils/apiError";

const app: Express = express();

// Security Middlewares
app.use(helmet()); // Set various HTTP headers for security

// CORS Configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow from configured origin or all origins in development
    const allowedOrigins = (config.corsOrigin || "").split(",");
    if (
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin) ||
      config.env === "development"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Important for cookies
};
app.use(cors(corsOptions));

// Request Parsing
app.use(express.json({ limit: "16kb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// HTTP Request Logging
if (config.env !== "test") {
  app.use(
    morgan(config.env === "development" ? "dev" : "combined", {
      stream: { write: (message) => logger.http(message.trim()) },
      skip: (req, res) => res.statusCode < 400 && config.env === "production", // Skip successful requests in prod
    })
  );
}

// Basic Route for Health Check
app.get("/", (req: Request, res: Response) => {
  res.status(httpStatusCodes.OK).send("Mehendi App Backend is Alive! 🌿");
});
app.get("/health", (req: Request, res: Response) => {
  res
    .status(httpStatusCodes.OK)
    .json({ status: "UP", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1", apiRoutes); // Prefix all API routes with /api/v1

// Handle 404 Not Found errors for API routes
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  next(
    new ApiError(
      httpStatusCodes.NOT_FOUND,
      `API endpoint not found: ${req.originalUrl}`
    )
  );
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;
