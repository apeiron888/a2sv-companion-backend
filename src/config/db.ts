import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
}
