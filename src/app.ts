import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import * as monitoring from "./config/monitoring.js";
import { errorHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { submissionsRouter } from "./routes/submissions.js";
import { adminRouter } from "./routes/admin.js";

export function createApp() {
  const app = express();
  monitoring.initMonitoring();

  if (monitoring.sentryRequestHandler) {
    app.use(monitoring.sentryRequestHandler);
  }

  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true
  }));
  app.use(express.json({ limit: "2mb" }));
  app.use(
    pinoHttp({
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport: env.NODE_ENV === "production" ? undefined : {
        target: "pino-pretty",
        options: { colorize: true }
      }
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const adminPath = path.join(__dirname, "..", "public", "admin");
  app.use("/admin", express.static(adminPath));

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/submissions", submissionsRouter);
  app.use("/api/admin", adminRouter);

  if (monitoring.sentryErrorHandler) {
    app.use(monitoring.sentryErrorHandler);
  }
  app.use(errorHandler);
  return app;
}
