# Backend Deployment (Render)

## Render Blueprint
Create a `render.yaml` at the repo root (already provided) and deploy.

## Required Environment Variables

### Server
- `PORT` — Render injects this automatically.
- `NODE_ENV` — set to `production` for proper logging.
- `CORS_ORIGINS` — comma-separated list of allowed origins (extension ID + admin UI domain).

### Database
- `MONGODB_URI` — MongoDB connection string for your database.

### Auth
- `JWT_SECRET` — signing key for access tokens.
- `JWT_EXPIRES_IN` — access token lifetime (e.g., 15m).
- `ENCRYPTION_KEY` — base64 of a 32-byte key to encrypt GitHub tokens.
- `REFRESH_TOKEN_TTL_DAYS` — refresh token lifetime in days.

### GitHub OAuth
- `GITHUB_CLIENT_ID` — OAuth app client ID.
- `GITHUB_CLIENT_SECRET` — OAuth app client secret.
- `GITHUB_CALLBACK_URL` — GitHub OAuth callback (backend URL).
- `AUTH_SUCCESS_REDIRECT` — extension success page.
- `AUTH_ERROR_REDIRECT` — extension error page.

### Google Sheets
- `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` — base64-encoded JSON for the service account.

### Admin
- `ADMIN_API_KEY` — static API key used by the admin UI.

### Optional
- `REDIS_URL` — enable queue processing when present.
- `SENTRY_DSN` — enable error monitoring.

## Notes
- Share all Google Sheets with the service account email.
- For Render, use the same build/start commands from `render.yaml`.
