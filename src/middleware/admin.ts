import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-admin-key"]?.toString();
  if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
}
