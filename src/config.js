import { config } from "dotenv";

config();

export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"
export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;