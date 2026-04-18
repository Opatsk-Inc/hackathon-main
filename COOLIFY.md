# Deploying to Coolify

Self-hostable, zero-interference-with-local deployment. Local dev still uses
`backend/.env` and `npm run start:dev` — none of this changes that.

## Files added

| File                                   | Purpose                                                          |
|----------------------------------------|------------------------------------------------------------------|
| `docker-compose.coolify.yml`           | Coolify-only compose: backend + frontend + postgres              |
| `.env.coolify.example`                 | Template to paste into Coolify's env variable editor             |
| `front/Dockerfile`                     | Frontend build → nginx with runtime env injection                |
| `front/nginx.conf`                     | SPA routing + cache headers                                      |
| `front/docker-entrypoint.sh`           | Writes `/env.js` at container start (no rebuild to change URLs)  |
| `front/public/env.js`                  | Dev placeholder so the `<script>` tag doesn't 404 locally        |

Backend `Dockerfile` is unchanged — the reset/migrate/seed flow runs via the
`command:` override in `docker-compose.coolify.yml` so local builds keep
working.

## One-time setup in Coolify

1. **Create a new Resource → "Docker Compose Empty"** in your project.
2. **Source:** point at this git repository + branch.
3. **Docker Compose Location:** set to `docker-compose.coolify.yml` (NOT the
   default `docker-compose.yml`).
4. **Environment Variables:** open `.env.coolify.example`, copy its contents
   into Coolify's bulk env editor, and replace every `change_me_*` value.
   Generate a JWT secret with `openssl rand -hex 32`.
5. **Domains:**
   - On the **backend** service row → set your backend FQDN (e.g.
     `api.example.com`). Coolify exposes this as `SERVICE_FQDN_BACKEND_1488`
     inside the compose file. Port mapping to `1488` is automatic.
   - On the **frontend** service row → set your frontend FQDN (e.g.
     `app.example.com`). Exposed as `SERVICE_FQDN_FRONTEND_80`.
6. **Deploy.**

## What happens on every deploy

1. Coolify pulls the latest commit.
2. `postgres` starts, healthcheck runs until ready.
3. `backend` waits for the healthy postgres, then:
   - if `RESET_DB_ON_DEPLOY=true` → `prisma migrate reset --force` (wipes DB,
     re-applies all migrations)
   - else → `prisma migrate deploy` (only pending migrations; data preserved)
   - runs `prisma db seed` if `backend/prisma/seed.ts` exists (non-fatal)
   - starts NestJS on port 1488
4. `frontend` builds the Vite app into `dist/`, then serves it via nginx on
   port 80. `docker-entrypoint.sh` writes `/env.js` with the Coolify-provided
   `VITE_API_URL` so the browser picks up the backend FQDN without a rebuild.

## Using the runtime API URL in the React app

Read it via `window.__ENV__`:

```ts
const apiUrl = (window as any).__ENV__?.VITE_API_URL ?? "";
fetch(`${apiUrl}/users`);
```

Add a typed accessor somewhere central (e.g. `src/shared/config.ts`) so you
don't sprinkle `window as any` throughout the codebase.

## Keep the DB across deploys

Set `RESET_DB_ON_DEPLOY=false` in Coolify env vars. The named volume
`postgres_data` already persists across container restarts — the reset flag
only controls the Prisma reset step.

## Update the backend CORS allowlist

`backend/src/main.ts` hardcodes allowed origins. Add your frontend Coolify
domain (e.g. `https://app.example.com`) to the `origin` array, or refactor to
read from `process.env.CORS_ORIGINS` and add `CORS_ORIGINS=...` to
`.env.coolify.example` + the compose env block.

## Troubleshooting

- **502 / Gateway Timeout:** Coolify couldn't reach the container. Confirm the
  service exposes its port (backend 1488, frontend 80) and healthchecks are
  passing in the Coolify logs.
- **`prisma db seed` fails:** create `backend/prisma/seed.ts` — without it the
  block is skipped (logged, non-fatal).
- **Migration conflicts after a reset:** check `backend/prisma/migrations/` —
  `reset --force` drops everything and re-applies them in order; conflicts
  usually mean two developers committed overlapping migrations.
