import { Router } from "express";
import { env } from "../config/env.js";
import { OAuthTokenModel } from "../models/oauthToken.js";
import { UserModel } from "../models/user.js";

const router = Router();

router.get("/auth/github/start", (_req, res) => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CALLBACK_URL) {
    return res.status(500).json({ error: "GitHub OAuth not configured" });
  }

  const redirectUrl = new URL("https://github.com/login/oauth/authorize");
  redirectUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", env.GITHUB_CALLBACK_URL);
  redirectUrl.searchParams.set("scope", "repo read:user user:email");

  return res.redirect(redirectUrl.toString());
});

router.get("/auth/github/callback", (_req, res) => {
  const code = _req.query.code as string | undefined;
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ error: "GitHub OAuth not configured" });
  }

  const tokenParams = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    client_secret: env.GITHUB_CLIENT_SECRET,
    code
  });

  fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: tokenParams
  })
    .then(async (resp) => {
      if (!resp.ok) throw new Error("Failed to exchange code");
      const tokenJson = (await resp.json()) as { access_token?: string; scope?: string };
      if (!tokenJson.access_token) throw new Error("Missing access token");

      const userResp = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` }
      });
      if (!userResp.ok) throw new Error("Failed to fetch GitHub user");
      const userJson = (await userResp.json()) as { id: number; login: string };

      const user = await UserModel.findOneAndUpdate(
        { githubUserId: String(userJson.id) },
        { githubUserId: String(userJson.id), githubUsername: userJson.login },
        { new: true, upsert: true }
      );

      await OAuthTokenModel.findOneAndUpdate(
        { userId: String(user._id), provider: "github" },
        { userId: String(user._id), provider: "github", accessToken: tokenJson.access_token, scope: tokenJson.scope },
        { upsert: true }
      );

      return res.json({ userId: user._id, githubUsername: user.githubUsername });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.get("/auth/google/start", (_req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    return res.status(500).json({ error: "Google OAuth not configured" });
  }

  const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  redirectUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", env.GOOGLE_CALLBACK_URL);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("access_type", "offline");
  redirectUrl.searchParams.set("scope", "https://www.googleapis.com/auth/spreadsheets");

  return res.redirect(redirectUrl.toString());
});

router.get("/auth/google/callback", (_req, res) => {
  const code = _req.query.code as string | undefined;
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    return res.status(500).json({ error: "Google OAuth not configured" });
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    grant_type: "authorization_code"
  });

  fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams
  })
    .then(async (resp) => {
      if (!resp.ok) throw new Error("Failed to exchange code");
      const tokenJson = (await resp.json()) as {
        access_token?: string;
        refresh_token?: string;
        scope?: string;
        expires_in?: number;
      };
      if (!tokenJson.access_token) throw new Error("Missing access token");

      const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` }
      });
      if (!userResp.ok) throw new Error("Failed to fetch Google user");
      const userJson = (await userResp.json()) as { id: string; name?: string; email?: string };

      const user = await UserModel.findOneAndUpdate(
        { googleUserId: userJson.id },
        { googleUserId: userJson.id, displayName: userJson.name || userJson.email },
        { new: true, upsert: true }
      );

      const expiresAt = tokenJson.expires_in
        ? new Date(Date.now() + tokenJson.expires_in * 1000)
        : undefined;

      await OAuthTokenModel.findOneAndUpdate(
        { userId: String(user._id), provider: "google" },
        {
          userId: String(user._id),
          provider: "google",
          accessToken: tokenJson.access_token,
          refreshToken: tokenJson.refresh_token,
          scope: tokenJson.scope,
          expiresAt
        },
        { upsert: true }
      );

      return res.json({ userId: user._id, displayName: user.displayName });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.post("/auth/logout", (_req, res) => {
  const userId = _req.header("x-user-id") as string | undefined;
  if (!userId) {
    return res.status(400).json({ error: "Missing x-user-id" });
  }
  OAuthTokenModel.deleteMany({ userId })
    .then(() => res.status(204).send())
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;
