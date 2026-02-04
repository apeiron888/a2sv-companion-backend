import crypto from "crypto";
import { env } from "../config/env.js";
import { RefreshTokenModel } from "../models/RefreshToken.js";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create({ userId, tokenHash, expiresAt });
  return token;
}

export async function rotateRefreshToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshTokenModel.findOne({ tokenHash, revokedAt: { $exists: false } });

  if (!existing) {
    throw new Error("Invalid refresh token");
  }
  if (existing.expiresAt.getTime() < Date.now()) {
    throw new Error("Refresh token expired");
  }

  existing.revokedAt = new Date();
  await existing.save();

  const newToken = await issueRefreshToken(existing.userId.toString());
  return { userId: existing.userId.toString(), refreshToken: newToken };
}

export async function revokeRefreshToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await RefreshTokenModel.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
}
