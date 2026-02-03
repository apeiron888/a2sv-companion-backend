import { env } from "../config/env.js";
import { OAuthTokenModel } from "../models/oauthToken.js";

export async function refreshGoogleToken(userId: string, refreshToken: string) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const tokenParams = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }

  const tokenJson = (await resp.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!tokenJson.access_token) {
    throw new Error("Missing access token in refresh response");
  }

  const expiresAt = tokenJson.expires_in
    ? new Date(Date.now() + tokenJson.expires_in * 1000)
    : undefined;

  const updated = await OAuthTokenModel.findOneAndUpdate(
    { userId, provider: "google" },
    { accessToken: tokenJson.access_token, scope: tokenJson.scope, expiresAt },
    { new: true }
  );

  return updated;
}
