import * as Sentry from "@sentry/node";
import { env } from "./env.js";

export let sentryRequestHandler: ReturnType<typeof Sentry.Handlers.requestHandler> | null = null;
export let sentryErrorHandler: ReturnType<typeof Sentry.Handlers.errorHandler> | null = null;

export function initMonitoring() {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1
  });

  sentryRequestHandler = Sentry.Handlers.requestHandler();
  sentryErrorHandler = Sentry.Handlers.errorHandler();
}
