# External Integrations

**Analysis Date:** 2026-04-18

## APIs & External Services

**Geocoding:**
- Nominatim (OpenStreetMap) - Address-to-coordinates geocoding for anomaly records
  - SDK/Client: Native `fetch` (no SDK)
  - Auth: None (User-Agent: `LionsShare/1.0 (hackathon@lionsshare.ua)`)
  - Implementation: `backend/src/geo/geo.service.ts`
  - Notes: Rate-limited (429 handling with exponential backoff, 3 retries); scoped to Ukraine (`countrycodes=ua`)

**Maps (Frontend):**
- MapLibre GL JS - Interactive map rendering with markers and popups
  - SDK/Client: `maplibre-gl` ^5.23.0
  - Auth: None (open-source renderer; tile source not explicitly configured in found files)
  - Implementation: `front/src/components/ui/map.tsx`

- Google Maps - External deep-link for navigation on mobile inspector page
  - SDK/Client: `@vis.gl/react-google-maps` ^1.8.3 (imported in package.json but primary map is MapLibre)
  - Usage: Opens `https://maps.google.com/?q=lat,lng` in new tab
  - Implementation: `front/src/pages/inspector/TaskInspectionPage.tsx`

**Development Tunneling:**
- localtunnel ^2.0.2 - Exposes local backend over public URL during development
  - The frontend `ApiClient` sends `bypass-tunnel-reminder: true` header to bypass the localtunnel confirmation page
  - Implementation: `front/src/lib/api/client.ts`

## Data Storage

**Databases:**
- PostgreSQL 17
  - Connection env var: `DATABASE_URL` (format: `postgresql://user:pass@host:5432/db?schema=public`)
  - Additional vars: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`
  - Client/ORM: Prisma 7.6.0 with `@prisma/adapter-pg` (connection pooling via `pg`)
  - Schema: `backend/prisma/schema.prisma`
  - Migrations: `backend/prisma/migrations/`
  - Models: `User`, `Warehouse`, `Resource`, `Inventory`, `Order`, `Trip`, `TripPoint`, `ImportBatch`, `Hromada`, `LandRecord`, `RealEstateRecord`, `Anomaly`
  - Service: `backend/src/prisma/prisma.service.ts`

**File Storage:**
- Local filesystem only (uploaded CSV/Excel files processed in-memory via `papaparse` / `xlsx`)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no third-party auth provider)
  - Implementation: `backend/src/auth/auth.module.ts`, `backend/src/auth/auth.service.ts`, `backend/src/auth/jwt.strategy.ts`
  - Token signed with `JWT_SECRET` env var, default expiry `7d`
  - Passwords hashed with `bcrypt` ^6.0.0
  - Token stored in browser `localStorage` (`auth_token` key)
  - All API requests send `Authorization: Bearer <token>` header
  - Frontend store: `front/src/features/auth/store/auth.store.ts` (zustand + persist middleware)
  - Two roles: `WAREHOUSE_MANAGER`, `DISPATCHER`
  - Hromada entities have separate `email`/`passwordHash` fields for portal login

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, etc.)

**Logs:**
- NestJS built-in `Logger` class used in services (e.g., `backend/src/geo/geo.service.ts`)
- Standard stdout/stderr; no structured logging pipeline or log aggregator configured

## CI/CD & Deployment

**Hosting:**
- Coolify (self-hosted PaaS) - Docker Compose deployment
  - Config: `docker-compose.coolify.yml`
  - Backend FQDN: `api.notfounds.dev` (port 1488, proxied by Coolify)
  - Frontend FQDN: `main.notfounds.dev` (port 80, nginx, proxied by Coolify)
  - DB reset behavior: controlled by `RESET_DB_ON_DEPLOY` env var

**CI Pipeline:**
- None detected (no GitHub Actions, CircleCI, etc.)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Environment Configuration

**Required env vars (backend):**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Used by deploy scripts and healthchecks

**Optional env vars (backend):**
- `PORT` - Server port (default: `1488`)
- `EXPIRATION_TIME` - JWT expiry (default: `7d`)
- `RESET_DB_ON_DEPLOY` - Drop and reseed on deploy (default: `true`)
- `NODE_ENV` - Runtime environment

**Required env vars (frontend):**
- `VITE_API_URL` - Backend API base URL (falls back to `http://localhost:1488` on localhost)

**Secrets location:**
- `backend/.env` (local development, gitignored)
- Coolify UI "Environment Variables" section (production)

## File Import Pipeline

**Supported Formats:**
- CSV (via `papaparse` ^5.4.1)
- Excel / XLSX (via `xlsx` ^0.18.5)

**Flow:**
- Files uploaded via multipart/form-data to `backend/src/import/import.controller.ts`
- Parsed by `backend/src/import/import.service.ts`
- Cross-matched against land registry (`LandRecord`) to detect anomalies
- Geocoding via Nominatim called for each anomaly record address
- Results stored as `RealEstateRecord`, `Anomaly` rows linked to `ImportBatch` and `Hromada`

---

*Integration audit: 2026-04-18*
