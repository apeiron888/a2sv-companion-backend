import mongoose, { Schema } from "mongoose";

export interface UserDoc {
  role: "student" | "manager";
  githubUserId?: string;
  githubUsername?: string;
  googleUserId?: string;
  displayName?: string;
  sheetRowIdentifier?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    role: { type: String, required: true, enum: ["student", "manager"], default: "student" },
    githubUserId: String,
    githubUsername: String,
    googleUserId: String,
    displayName: String,
    sheetRowIdentifier: String
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("User", userSchema);
