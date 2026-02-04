import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    groupName: { type: String, required: true },
    sheetRow: { type: Number, required: true },
    githubUsername: { type: String },
    githubRepo: { type: String },
    githubAccessToken: { type: String },
    githubAccessTokenEnc: { type: String },
    status: { type: String, enum: ["pending_github", "active"], default: "pending_github" }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", UserSchema);
