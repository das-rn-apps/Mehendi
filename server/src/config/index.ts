import dotenv from "dotenv";
import path from "path";

// Determine which .env file to load based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) }); // process.cwd() ensures it looks from the root

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  mongo: {
    uri:
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/mehndi_app_db_default",
    dbName: process.env.DB_NAME || "mehndi_app_db_default",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "supersecret",
    accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || "15m",
    refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d",
    refreshTokenCookieName:
      process.env.JWT_REFRESH_TOKEN_COOKIE_NAME || "refreshToken",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  otp: {
    expirationMinutes: Number(process.env.OTP_EXPIRATION_MINUTES) || 5,
  },
};

export default config;
