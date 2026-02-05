import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireExtensionKey } from "../middleware/extension.js";

export const usersRouter = Router();

usersRouter.get("/me", requireExtensionKey, requireAuth, (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
});
