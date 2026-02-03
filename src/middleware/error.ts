import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: "Not Found", path: req.path });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  res.status(500).json({ error: "Internal Server Error", message: err.message });
}
