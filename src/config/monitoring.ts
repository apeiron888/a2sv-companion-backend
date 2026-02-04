import * as Sentry from "@sentry/node";
import type { RequestHandler, ErrorRequestHandler } from "express";
import { env } from "./env.js";

export let sentryRequestHandler: RequestHandler | null = null;
export let sentryErrorHandler: ErrorRequestHandler | null = null;

export function initMonitoring() {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1
  });

  const handlers = (Sentry as unknown as { Handlers?: { requestHandler?: () => RequestHandler; errorHandler?: () => ErrorRequestHandler } }).Handlers;
  if (handlers?.requestHandler && handlers?.errorHandler) {
    sentryRequestHandler = handlers.requestHandler();
    sentryErrorHandler = handlers.errorHandler();
  }
}
