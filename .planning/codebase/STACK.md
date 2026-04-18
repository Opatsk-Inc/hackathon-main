# Technology Stack

**Analysis Date:** 2026-04-18

## Languages

**Primary:**
- TypeScript 5.x - Both backend and frontend
  - Backend: `backend/tsconfig.json` targets ES2017, CommonJS modules, strict null checks
  - Frontend: `front/tsconfig.app.json` targets ES2022, ESNext modules, strict mode

**Secondary:**
- Shell scripting - Docker entrypoint scripts (`front/docker-entrypoint.sh`, `docker-compose.coolify.yml`)

## Runtime

**Environment:**
- Node.js 22.x (Docker image `node:22-alpine`; local runtime detected as v25.1.0)

**Package Manager:**
- npm (both workspaces)
- Lockfile: `package-lock.json` present in both `backend/` and `front/`

## Frameworks

**Backend (NestJS):**
- `@nestjs/common` ^11.1.17 - Core NestJS decorators, pipes, guards
- `@nestjs/core` ^11.1.17 - NestJS application factory
- `@nestjs/config` 4.0.3 - Environment config via `ConfigModule.forRoot`
- `@nestjs/jwt` ^11.0.2 - JWT token signing/verification
- `@nestjs/passport` ^11.0.5 - Passport.js integration
- `@nestjs/swagger` ^11.2.6 - OpenAPI/Swagger docs (served at `/api`)
- `@nestjs/throttler` 6.5.0 - Rate limiting
- `@nestjs/platform-express` ^11.1.17 - Express HTTP adapter

**Frontend (React):**
- React 19.x - UI library
- React Router DOM ^7.14.1 - Client-side routing
- Vite ^7.3.1 - Build tool and dev server (`front/vite.config.ts`)
- TailwindCSS ^4.2.1 - Utility-first CSS (via `@tailwindcss/vite` plugin)

**Testing:**
- Not detected (no test files or test framework config found)

**Build/Dev:**
- `@nestjs/cli` ^11.0.17 - NestJS build and scaffold
- `tsx` ^4.21.0 - TypeScript execution for scripts (seed, etc.)
- `dotenv-cli` 11.0.0 - `.env` injection for npm scripts

## Key Dependencies

**Critical (Backend):**
- `prisma` 7.6.0 / `@prisma/client` 7.6.0 - ORM and query builder
- `@prisma/adapter-pg` ^7.6.0 - PostgreSQL driver adapter for Prisma
- `pg` ^8.20.0 - PostgreSQL client (used by Prisma adapter)
- `passport` ^0.7.0 / `passport-jwt` ^4.0.1 - JWT authentication strategy
- `bcrypt` ^6.0.0 - Password hashing
- `class-validator` ^0.15.1 / `class-transformer` ^0.5.1 - DTO validation
- `helmet` ^8.1.0 - HTTP security headers
- `xlsx` ^0.18.5 / `papaparse` ^5.4.1 - Excel and CSV file parsing (import pipeline)
- `nodemailer` ^8.0.4 - Email sending (imported, not actively used in found sources)
- `nanoid` ^5.1.7 - Unique ID generation
- `localtunnel` ^2.0.2 - Local dev tunnel (dev tooling only)

**Critical (Frontend):**
- `@tanstack/react-query` ^5.99.0 - Server state management and data fetching
- `zustand` ^5.0.12 - Client state management (`front/src/features/auth/store/auth.store.ts`)
- `maplibre-gl` ^5.23.0 - Interactive map rendering (`front/src/components/ui/map.tsx`)
- `recharts` ^3.8.0 - Chart/data visualization components
- `@tanstack/react-table` ^8.21.3 - Headless table logic
- `framer-motion` ^12.38.0 / `motion` ^12.38.0 - Animations
- `radix-ui` ^1.4.3 - Headless UI primitives (shadcn base)
- `shadcn` ^4.2.0 - Component library scaffolding (`front/components.json`)
- `lucide-react` ^1.8.0 - Icon set
- `vaul` ^1.1.2 - Drawer/sheet component

**Infrastructure:**
- `class-variance-authority` ^0.7.1 - Variant-based component styling
- `clsx` ^2.1.1 / `tailwind-merge` ^3.5.0 - Conditional class name utilities

## Configuration

**Environment (Backend):**
- Loaded from `.env` file via `dotenv-cli` in npm scripts
- Configured via `ConfigModule.forRoot({ isGlobal: true })` in `backend/src/app.module.ts`
- Key required vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Optional vars: `EXPIRATION_TIME` (default `7d`), `RESET_DB_ON_DEPLOY` (default `true`)
- Prisma config: `backend/prisma.config.ts`

**Environment (Frontend):**
- `VITE_API_URL` - Backend API base URL (overrides localhost default)
- In production Docker build, runtime env injection via `front/docker-entrypoint.sh` writes `window.__ENV__` to `env.js`
- In development, auto-detects localhost and falls back to `http://localhost:1488`

**Build:**
- Backend: `backend/tsconfig.build.json`, compiled with `nest-cli.json`, output to `backend/dist/`
- Frontend: `front/vite.config.ts`, path alias `@` → `./src`, output to `front/dist/`

## Platform Requirements

**Development:**
- Node.js 22+
- PostgreSQL 17 (or via Docker)
- `.env` file in `backend/` with `DATABASE_URL` and `JWT_SECRET`
- `npm install` in both `backend/` and `front/`

**Production:**
- Docker + Docker Compose (Coolify deployment via `docker-compose.coolify.yml`)
- PostgreSQL 17 (containerized as `postgres:17-alpine`)
- Backend served on port 1488; frontend served via nginx on port 80
- Hosted at `https://api.notfounds.dev` (backend) and `https://main.notfounds.dev` (frontend)

---

*Stack analysis: 2026-04-18*
