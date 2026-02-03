import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  await mongoose.connect(env.DATABASE_URL);
}
