import mongoose, { Schema } from "mongoose";

export interface OAuthTokenDoc {
  userId: string;
  provider: "github" | "google";
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: Date;
}

const oauthTokenSchema = new Schema<OAuthTokenDoc>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, enum: ["github", "google"] },
    accessToken: { type: String, required: true },
    refreshToken: String,
    scope: String,
    expiresAt: Date
  },
  { timestamps: true }
);

export const OAuthTokenModel = mongoose.model<OAuthTokenDoc>("OAuthToken", oauthTokenSchema);
