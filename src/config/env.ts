import dotenv from "dotenv";

dotenv.config();

const toArray = (value: string | undefined) =>
  value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || "",
  AUTH_SUCCESS_REDIRECT: process.env.AUTH_SUCCESS_REDIRECT || "",
  AUTH_ERROR_REDIRECT: process.env.AUTH_ERROR_REDIRECT || "",
  GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 || "",
  MASTER_SHEET_ID: process.env.MASTER_SHEET_ID || "",
  REDIS_URL: process.env.REDIS_URL || "",
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || "",
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "",
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  SENTRY_DSN: process.env.SENTRY_DSN || "",
  CORS_ORIGINS: toArray(process.env.CORS_ORIGINS),
  GROUP_START_COLUMN: process.env.GROUP_START_COLUMN || "H"
};
