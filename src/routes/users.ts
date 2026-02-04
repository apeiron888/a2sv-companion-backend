import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
});
