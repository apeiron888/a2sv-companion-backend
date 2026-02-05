import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ExtensionInstallModel } from "../models/ExtensionInstall.js";

export interface ExtensionRequest extends Request {
  extensionInstallId?: string;
}

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function requireExtensionKey(req: ExtensionRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-extension-key"]?.toString();
  if (!apiKey) {
    return res.status(401).json({ success: false, message: "Missing extension key" });
  }

  const keyHash = hashKey(apiKey);
  const install = await ExtensionInstallModel.findOne({ keyHash, revokedAt: { $exists: false } });
  if (!install) {
    return res.status(401).json({ success: false, message: "Invalid extension key" });
  }

  install.lastSeenAt = new Date();
  await install.save();

  req.extensionInstallId = install.installId;
  return next();
}

export function generateExtensionKey() {
  return crypto.randomBytes(32).toString("hex");
}

export function generateInstallId() {
  return crypto.randomBytes(16).toString("hex");
}

export function hashExtensionKey(key: string) {
  return hashKey(key);
}
