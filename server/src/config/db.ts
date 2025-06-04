import mongoose from "mongoose";
import config from "./index";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongo.uri, {
      dbName: config.mongo.dbName,
    });
    logger.info("MongoDB Connected Successfully! 🔗");
  } catch (error) {
    logger.error("MongoDB Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
