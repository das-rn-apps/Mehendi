import http from "http";
import app from "./app"; // Your Express app
import config from "./config";
import logger from "./utils/logger";
import connectDB from "./config/db";
import { initSocketServer } from "./sockets"; // Your Socket.IO setup
import { initializeNotificationService } from "./services/notification.service";

const PORT = config.port || 3001; // Fallback port

const httpServer = http.createServer(app);

// Initialize Socket.IO server
const io = initSocketServer(httpServer);

// Initialize Notification Service (if you structured it this way)
// The initSocketServer already initializes it, so this line might be redundant
// depending on your notification service structure.
// If notification service needs the 'io' instance and is separate:
// initializeNotificationService(io);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`🔗 Base URL: http://localhost:${PORT}`);
      logger.info(`📡 WebSocket server initialized.`);
      // Log other important config details if necessary
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful Shutdown
const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      logger.info("HTTP server closed.");
      // Close MongoDB connection
      require("mongoose").connection.close(false, () => {
        // Mongoose docs suggest 'false' for immediate close
        logger.info("MongoDB connection closed.");
        process.exit(0);
      });
    });

    // If server hasn't finished in 10 seconds, force exit
    setTimeout(() => {
      logger.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000); // 10 seconds
  });
});

// Handle Unhandled Rejections and Uncaught Exceptions
process.on(
  "unhandledRejection",
  (reason: Error | any, promise: Promise<any>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Optionally, shut down server:
    // httpServer.close(() => process.exit(1));
  }
);

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  // Gracefully shutdown is important here to prevent leaving system in an inconsistent state
  // httpServer.close(() => process.exit(1)); // Be cautious with auto-exit in prod
});

startServer();
