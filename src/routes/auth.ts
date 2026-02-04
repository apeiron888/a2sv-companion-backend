import { Router } from "express";
import { z } from "zod";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { UserModel } from "../models/User.js";
import { env } from "../config/env.js";
import { findUserRow } from "../services/googleSheets.js";
import { exchangeGitHubCode, fetchGitHubUser, verifyRepoAccess } from "../services/github.js";
import { signAuthToken, signTempToken, verifyTempToken } from "../services/jwt.js";
import { encryptSecret } from "../services/crypto.js";
import { issueRefreshToken, revokeRefreshToken, rotateRefreshToken } from "../services/refreshTokens.js";

export const authRouter = Router();

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  group_name: z.string().min(2),
  github_repo: z.string().min(3)
});

const loginSchema = z.object({
  email: z.string().email()
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const groupSheet = await GroupSheetModel.findOne({ groupName: payload.group_name, active: true });
    if (!groupSheet) {
      return res.status(400).json({ success: false, message: "Invalid group" });
    }

    const row = await findUserRow({
      sheetId: groupSheet.sheetId,
      nameColumn: groupSheet.nameColumn,
      startRow: groupSheet.nameStartRow,
      endRow: groupSheet.nameEndRow,
      fullName: payload.full_name
    });

    if (!row) {
      return res.status(400).json({ success: false, message: "User not found in group sheet" });
    }

    const user = await UserModel.create({
      fullName: payload.full_name,
      email: payload.email,
      groupName: payload.group_name,
      sheetRow: row,
      githubRepo: payload.github_repo,
      status: "pending_github"
    });

    const tempToken = signTempToken(user.id);

    return res.json({
      success: true,
      temp_token: tempToken,
      message: "Proceed to GitHub OAuth"
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await UserModel.findOne({ email: payload.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "GitHub not connected" });
    }

    const jwt = signAuthToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    return res.json({ success: true, token: jwt, refresh_token: refreshToken });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/github/oauth", (req, res) => {
  const state = req.query.state?.toString();
  if (!state) {
    return res.status(400).json({ success: false, message: "Missing state" });
  }

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: "repo",
    state
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

authRouter.get("/github/callback", async (req, res, next) => {
  try {
    const code = req.query.code?.toString();
    const state = req.query.state?.toString();

    if (!code || !state) {
      return res.status(400).json({ success: false, message: "Missing code or state" });
    }

    const userId = verifyTempToken(state);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const accessToken = await exchangeGitHubCode(code);
    const githubUser = await fetchGitHubUser(accessToken);

    const hasAccess = await verifyRepoAccess(accessToken, user.githubRepo || "");
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "GitHub repo access denied" });
    }

    user.githubAccessTokenEnc = encryptSecret(accessToken);
    user.githubUsername = githubUser.login;
    user.status = "active";
    await user.save();

    const jwt = signAuthToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    if (env.AUTH_SUCCESS_REDIRECT) {
      const url = new URL(env.AUTH_SUCCESS_REDIRECT);
      url.searchParams.set("token", jwt);
      url.searchParams.set("refresh", refreshToken);
      return res.redirect(url.toString());
    }

    return res.json({ success: true, token: jwt, refresh_token: refreshToken });
  } catch (error) {
    if (env.AUTH_ERROR_REDIRECT) {
      const url = new URL(env.AUTH_ERROR_REDIRECT);
      url.searchParams.set("reason", "oauth_failed");
      return res.redirect(url.toString());
    }
    return next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.body?.refresh_token as string;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }
    const { userId, refreshToken: newRefreshToken } = await rotateRefreshToken(refreshToken);
    const jwt = signAuthToken(userId);
    return res.json({ success: true, token: jwt, refresh_token: newRefreshToken });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.body?.refresh_token as string;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});
