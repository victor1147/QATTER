import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const SECRET = process.env.JWT_SECRET || "qr_secret_key";
export const DB_PATH = "./data.json";
