# A2SV Companion Backend

Backend API for the A2SV Companion Chrome extension. It handles GitHub OAuth, stores users and submissions, commits solutions to GitHub repositories, and updates group Google Sheets based on admin-configured mappings.

## Features
- GitHub OAuth for repo access
- Submission processing (commit to GitHub + update Google Sheets)
- Group + question + mapping admin APIs
- Queue-based processing with Redis (optional)
- MongoDB persistence

## Tech Stack
- Node.js + Express (TypeScript)
- MongoDB (Mongoose)
- Google Sheets API
- GitHub OAuth + Contents API
- BullMQ + Redis (optional)

## Quick Start

### 1) Install
```bash
npm install
```

### 2) Environment
Create a `.env` file based on `.env.example` and set required values.

Minimum required:
- `MONGODB_URI`
- `JWT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `AUTH_SUCCESS_REDIRECT`
- `AUTH_ERROR_REDIRECT`
- `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`
- `ENCRYPTION_KEY`

Optional:
- `REDIS_URL`
- `SENTRY_DSN`
- `CORS_ORIGINS`

### 3) Run (Dev)
```bash
npm run dev
```

### 4) Build + Start
```bash
npm run build
npm start
```

## Admin UI
The admin UI is served at `/admin`.
Use it to create groups, questions, and mappings.

## Important Notes
- Share your Google Sheet with the service account email.
- Set `AUTH_SUCCESS_REDIRECT` and `AUTH_ERROR_REDIRECT` to your extension success/error pages.
- For stable extension IDs in local dev, set a fixed `key` in the extension manifest.

## Deployment
See README_DEPLOY.md for Render deployment instructions.
