import { config } from "dotenv";

config();

export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"
export const PORT = process.env.PORT || 4000;