import mongoose, { Schema } from "mongoose";

const OAuthExchangeSchema = new Schema(
  {
    tempTokenHash: { type: String, required: true, unique: true },
    tokenEnc: { type: String },
    refreshTokenEnc: { type: String },
    errorCode: { type: String },
    errorMessage: { type: String },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date }
  },
  { timestamps: true }
);

OAuthExchangeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthExchangeModel = mongoose.model("OAuthExchange", OAuthExchangeSchema);
