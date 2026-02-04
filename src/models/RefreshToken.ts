import mongoose, { Schema } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date }
  },
  { timestamps: true }
);

export const RefreshTokenModel = mongoose.model("RefreshToken", RefreshTokenSchema);
