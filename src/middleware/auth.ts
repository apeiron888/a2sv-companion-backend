import type { NextFunction, Request, Response } from "express";

export interface AuthContext {
  userId: string;
  role: "student" | "manager";
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  const role = (req.header("x-user-role") || "student") as AuthContext["role"];

  if (!userId) {
    return res.status(401).json({ error: "Missing x-user-id" });
  }

  req.auth = { userId, role };
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.auth.role !== "manager") {
    return res.status(403).json({ error: "Manager role required" });
  }
  next();
}
