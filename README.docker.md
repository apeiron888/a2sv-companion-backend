# Docker Deployment

## Build
```
docker build -t a2sv-backend .
```

## Run (local)
```
docker run --env-file .env -p 4000:4000 a2sv-backend
```

## Required env vars
See .env.example for all required variables.
