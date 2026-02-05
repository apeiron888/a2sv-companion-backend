import { Router } from "express";
import { z } from "zod";
import { ExtensionInstallModel } from "../models/ExtensionInstall.js";
import { generateExtensionKey, generateInstallId, hashExtensionKey } from "../middleware/extension.js";

export const extensionRouter = Router();

const registerSchema = z.object({
  extension_version: z.string().optional()
});

extensionRouter.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body || {});

    const extensionKey = generateExtensionKey();
    const installId = generateInstallId();

    await ExtensionInstallModel.create({
      installId,
      keyHash: hashExtensionKey(extensionKey),
      extensionVersion: payload.extension_version,
      userAgent: req.headers["user-agent"]?.toString()
    });

    return res.json({ success: true, install_id: installId, extension_key: extensionKey });
  } catch (error) {
    return next(error);
  }
});
