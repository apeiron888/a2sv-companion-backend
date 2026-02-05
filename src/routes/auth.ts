import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { UserModel } from "../models/User.js";
import { OAuthExchangeModel } from "../models/OAuthExchange.js";
import { env } from "../config/env.js";
import { findUserRow } from "../services/googleSheets.js";
import { exchangeGitHubCode, fetchGitHubUser, verifyRepoAccess } from "../services/github.js";
import { signAuthToken, signTempToken, verifyTempToken } from "../services/jwt.js";
import { requireExtensionKey } from "../middleware/extension.js";
import { decryptSecret, encryptSecret } from "../services/crypto.js";
import { issueRefreshToken, revokeRefreshToken, rotateRefreshToken } from "../services/refreshTokens.js";

export const authRouter = Router();

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  group_name: z.string().min(2),
  github_repo: z.string().min(3)
});

const loginStartSchema = z.object({
  email: z.string().email()
});

const exchangeSchema = z.object({
  temp_token: z.string().min(10)
});

const EXCHANGE_TTL_MINUTES = 10;

function hashTempToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function exchangeExpiresAt() {
  return new Date(Date.now() + EXCHANGE_TTL_MINUTES * 60 * 1000);
}

function renderOAuthResult(title: string, message: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 32px; }
        .card { max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 12px; }
        p { color: #4b5563; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
  </html>`;
}

authRouter.post("/register", requireExtensionKey, async (req, res, next) => {
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

    const tempToken = signTempToken(user.id, "github_oauth");

    return res.json({
      success: true,
      temp_token: tempToken,
      message: "Proceed to GitHub OAuth"
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login/start", requireExtensionKey, async (req, res, next) => {
  try {
    const payload = loginStartSchema.parse(req.body);
    const user = await UserModel.findOne({ email: payload.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "GitHub not connected" });
    }

    const tempToken = signTempToken(user.id, "login");
    return res.json({ success: true, temp_token: tempToken });
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

    const { sub: userId, purpose } = verifyTempToken(state);
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

    if (purpose === "login") {
      if (!user.githubUsername || user.githubUsername !== githubUser.login) {
        return res.status(403).json({ success: false, message: "GitHub user mismatch" });
      }
    } else {
      user.githubAccessTokenEnc = encryptSecret(accessToken);
      user.githubUsername = githubUser.login;
      user.status = "active";
      await user.save();
    }

    const jwt = signAuthToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    await OAuthExchangeModel.findOneAndUpdate(
      { tempTokenHash: hashTempToken(state) },
      {
        tempTokenHash: hashTempToken(state),
        tokenEnc: encryptSecret(jwt),
        refreshTokenEnc: encryptSecret(refreshToken),
        errorCode: undefined,
        errorMessage: undefined,
        usedAt: undefined,
        expiresAt: exchangeExpiresAt()
      },
      { upsert: true, new: true }
    );

    return res
      .status(200)
      .send(renderOAuthResult("Authentication successful", "You can close this tab."));
  } catch (error) {
    const state = req.query.state?.toString();
    if (state) {
      await OAuthExchangeModel.findOneAndUpdate(
        { tempTokenHash: hashTempToken(state) },
        {
          tempTokenHash: hashTempToken(state),
          errorCode: "oauth_failed",
          errorMessage: "OAuth failed",
          usedAt: undefined,
          expiresAt: exchangeExpiresAt()
        },
        { upsert: true, new: true }
      );
    }
    return res
      .status(200)
      .send(renderOAuthResult("Authentication failed", "Please retry the login in the extension."));
  }
});

authRouter.post("/exchange", requireExtensionKey, async (req, res, next) => {
  try {
    const payload = exchangeSchema.parse(req.body || {});
    const tempTokenHash = hashTempToken(payload.temp_token);
    const exchange = await OAuthExchangeModel.findOne({ tempTokenHash });

    if (!exchange) {
      try {
        verifyTempToken(payload.temp_token);
      } catch {
        return res.status(400).json({ success: false, message: "Invalid or expired temp token" });
      }
      return res.status(202).json({ success: false, message: "Pending" });
    }

    if (exchange.usedAt) {
      return res.status(410).json({ success: false, message: "Token already exchanged" });
    }

    if (exchange.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, message: "Exchange expired" });
    }

    if (exchange.errorCode) {
      return res.status(400).json({ success: false, message: exchange.errorMessage || "OAuth failed" });
    }

    if (!exchange.tokenEnc || !exchange.refreshTokenEnc) {
      return res.status(202).json({ success: false, message: "Pending" });
    }

    const token = decryptSecret(exchange.tokenEnc);
    const refreshToken = decryptSecret(exchange.refreshTokenEnc);
    exchange.usedAt = new Date();
    await exchange.save();

    return res.json({ success: true, token, refresh_token: refreshToken });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/refresh", requireExtensionKey, async (req, res, next) => {
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

authRouter.post("/logout", requireExtensionKey, async (req, res, next) => {
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
