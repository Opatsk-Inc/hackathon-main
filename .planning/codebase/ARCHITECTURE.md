# Architecture

**Analysis Date:** 2026-04-18

## Pattern Overview

**Overall:** Monorepo with separate NestJS backend and React frontend. The backend follows a feature-module architecture (NestJS modules), and the frontend follows a feature-slice pattern with a shared API client layer.

**Key Characteristics:**
- Backend: NestJS modules, each encapsulating controller + service + DTOs. Prisma ORM as the single database access layer.
- Frontend: Features are self-contained slices (`features/`) with components, hooks, and types. Pages assemble features, shared `lib/api/` services handle all HTTP calls.
- Auth is hromada-based (Ukrainian territorial community), not user-based. A `Hromada` entity holds credentials and owns all data.
- Anomaly detection is the core business flow: land registry (seeded) cross-matched against uploaded real estate files to produce `Anomaly` records.

## Layers

**Backend - Controllers:**
- Purpose: Route HTTP requests, apply auth guards, extract user context via `@Usr()` decorator, delegate to service
- Location: `backend/src/<module>/<module>.controller.ts`
- Contains: Route decorators, Swagger annotations, `@UseGuards(AuthGuard('jwt'))`, calls to service methods
- Depends on: Service, DTOs, `AuthUser` type, `Usr` decorator
- Used by: HTTP clients (frontend)

**Backend - Services:**
- Purpose: Business logic and database access
- Location: `backend/src/<module>/<module>.service.ts`
- Contains: Database queries via `PrismaService`, cross-module calls (e.g., `ImportService` calls `GeoService`), anomaly detection algorithms
- Depends on: `PrismaService`, peer services (`GeoService`, `AnomalyEnrichment`)
- Used by: Controllers

**Backend - DTOs:**
- Purpose: Shape and validate request/response bodies
- Location: `backend/src/<module>/dto/request/*.request.dto.ts`, `backend/src/<module>/dto/response/*.response.dto.ts`
- Contains: Class-validator decorated classes, Swagger `@ApiProperty` annotations
- Depends on: `class-validator`, `@nestjs/swagger`

**Backend - Prisma Layer:**
- Purpose: Single point of database access across all services
- Location: `backend/src/prisma/prisma.service.ts`
- Contains: `PrismaClient` extension as an injectable NestJS service
- Depends on: `@prisma/client` (generated from `backend/prisma/schema.prisma`)
- Used by: All feature services

**Backend - Common:**
- Purpose: Shared cross-cutting utility shared across modules
- Location: `backend/src/common/anomaly-enrichment.ts`
- Contains: `enrichAnomaly()` pure function — maps `AnomalyType` + severity + fine to legal metadata (criminal articles, inspector actions, urgency)
- Used by: `AdminService`, `MobileService`

**Frontend - App / Entry:**
- Purpose: Root router, provider setup
- Location: `front/src/main.tsx`, `front/src/App.tsx`
- Contains: `QueryClientProvider`, `ThemeProvider`, `BrowserRouter`, route definitions with `ProtectedRoute`

**Frontend - Pages:**
- Purpose: Top-level route components, compose feature components and layouts
- Location: `front/src/pages/head/*.tsx` (desktop admin), `front/src/pages/inspector/*.tsx` (mobile inspector)
- Depends on: Layout components, feature components, lib hooks

**Frontend - Features:**
- Purpose: Domain-scoped slices with components, hooks, and types
- Location: `front/src/features/<feature>/` — auth, discrepancies, import, tasks
- Contains: Per-feature React components, TanStack Query hooks (`useQuery`/`useMutation`), TypeScript types
- Depends on: `lib/api/` services, Zustand store (auth only)

**Frontend - API Services (lib/api):**
- Purpose: Typed HTTP client wrappers per domain
- Location: `front/src/lib/api/client.ts`, `front/src/lib/api/auth.service.ts`, `front/src/lib/api/admin.service.ts`
- Contains: Static class methods delegating to `ApiClient`, request/response interfaces
- Depends on: `ApiClient` (fetch-based, attaches JWT from `localStorage`)

**Frontend - Zustand Store:**
- Purpose: Client-side auth state persistence
- Location: `front/src/features/auth/store/auth.store.ts`
- Contains: `token`, `user` (HromadaProfile), persisted to `localStorage` via `zustand/middleware/persist`

## Data Flow

**Import & Anomaly Detection Flow:**

1. Admin (hromada head) uploads a real estate CSV/XLSX file via `POST /api/import/real-estate`
2. `ImportController` receives the multipart file, extracts `user.id` (hromadaId) from JWT via `@Usr()`
3. `ImportService.importRealEstate()` parses the file (XLSX via `xlsx`, CSV via `papaparse`)
4. Service normalizes tax IDs and names (`normalizeTaxId`, `normalizeName`) for cross-matching
5. Service loads existing `LandRecord` rows for this hromada from Postgres
6. Service cross-matches real estate rows against land records (by taxId and normalized name)
7. Old `Anomaly`, `RealEstateRecord`, and `ImportBatch` records for this hromada are deleted
8. New `ImportBatch` and `RealEstateRecord` rows are created (batched in chunks of 500)
9. Anomalies are computed: `MISSING_IN_REAL_ESTATE`, `MISSING_IN_LAND`, `NO_ACTIVE_REAL_RIGHTS`, `AREA_MISMATCH`
10. All anomalies are saved to `anomaly` table; response returns batch + anomaly count

**Task Assignment & Geocoding Flow:**

1. Admin calls `PATCH /api/admin/tasks/assign` with `anomalyIds[]` and `inspectorId`
2. `AdminService.assignTask()` updates anomaly status to `IN_PROGRESS` and sets `inspectorId`
3. Background geocoding is triggered (fire-and-forget): `AdminService.geocodeAssignedAnomalies()`
4. `GeoService.geocodeAddress()` calls Nominatim OpenStreetMap API with 1.1s delay between requests to respect rate limits
5. Geocoded `lat/lng` coordinates are persisted back to each `Anomaly` row

**Inspector Mobile Flow:**

1. Inspector calls `GET /api/mobile/tasks?inspectorId=<id>` to get assigned anomalies
2. `MobileService` returns anomalies enriched with `enrichAnomaly()` metadata (legal articles, inspector actions)
3. Inspector calls `PATCH /api/mobile/tasks/:id/resolve` to mark task resolved with optional comment

**Auth Flow:**

1. Signup: POST `/auth/signup` with hromadaId + email + password. `AuthService` updates existing `Hromada` record with email and bcrypt hash, returns JWT.
2. Login: POST `/auth/login` validates credentials against `Hromada.passwordHash`, returns JWT.
3. All protected routes use `@UseGuards(AuthGuard('jwt'))`. `JwtStrategy` validates token via `AuthService.validateUser()`. `@Usr()` decorator extracts the validated `AuthUser` (Hromada) from request.

**State Management (Frontend):**
- Server state: TanStack Query (`@tanstack/react-query`) with `queryKey` caching and `staleTime`/`refetchInterval` configuration
- Auth state: Zustand store with `persist` middleware (stored in `localStorage` under `auth-storage`)
- Local UI state: `useState` within page components

## Key Abstractions

**Hromada (AuthUser):**
- Purpose: The authenticated tenant entity. Every protected endpoint scopes data by `user.id` (hromadaId). Not a generic "user" — it is the Ukrainian territorial community.
- Examples: `backend/src/auth/auth-user.ts`, `backend/src/auth/auth.service.ts`
- Pattern: `@Usr() user: AuthUser` in controllers; `user.id` passed as `hromadaId` to all service calls

**Anomaly:**
- Purpose: Core domain object. Represents a detected cross-registry discrepancy between LandRecord and RealEstateRecord.
- Examples: `backend/prisma/schema.prisma` (`model Anomaly`), `backend/src/common/anomaly-enrichment.ts`
- Pattern: Created by `ImportService`, read by `AdminService` and `MobileService`, enriched at read time by `enrichAnomaly()`

**ImportBatch:**
- Purpose: Groups a set of `RealEstateRecord` rows and their resulting `Anomaly` rows under a single file upload event.
- Examples: `backend/prisma/schema.prisma` (`model ImportBatch`), `backend/src/import/import.service.ts`
- Pattern: Each upload deletes all old batches for the hromada, then creates a fresh batch

**AnomalyEnrichment:**
- Purpose: Computed metadata added at read time to raw `Anomaly` data. Provides legal articles, inspector action descriptions, risk levels, and urgency days.
- Examples: `backend/src/common/anomaly-enrichment.ts`, `front/src/lib/api/types.ts`
- Pattern: Pure function; never persisted to DB; computed by both `AdminService.getDiscrepancies()` and `MobileService.getAssignedTasks()`

**ApiClient (Frontend):**
- Purpose: Centralized HTTP fetch wrapper. Handles auth token injection, Content-Type management, error normalization.
- Examples: `front/src/lib/api/client.ts`
- Pattern: Static class with `get`, `post`, `patch`, `postFormData` methods; all feature API service classes delegate to it

## Entry Points

**Backend HTTP Server:**
- Location: `backend/src/main.ts`
- Triggers: `NestFactory.create(AppModule)`, listens on `PORT` env var (default 1488)
- Responsibilities: CORS config, global `ValidationPipe`, Helmet security middleware, Swagger UI at `/api`

**Frontend SPA:**
- Location: `front/src/main.tsx`
- Triggers: Browser loads `index.html`, Vite bundles mount `createRoot`
- Responsibilities: Wraps `App` in `ThemeProvider` and `QueryClientProvider`

**Frontend Router:**
- Location: `front/src/App.tsx`
- Triggers: React Router `BrowserRouter`
- Responsibilities: Public routes (`/login`, `/signup`), protected head routes (`/head/*`), protected inspector routes (`/inspector/*`) wrapped in `ProtectedRoute`

## Error Handling

**Strategy:** NestJS built-in exception filters. Throw standard `HttpException` subclasses in services; NestJS serializes to JSON.

**Patterns:**
- Services throw `NotFoundException`, `BadRequestException`, `ConflictException`, `UnauthorizedException` from `@nestjs/common`
- Global `ValidationPipe` with `whitelist: true` rejects unknown properties and returns 400 with class-validator messages
- Frontend `ApiClient` throws `Error` with message `"<statusCode>::<body>"` on non-ok responses

## Cross-Cutting Concerns

**Logging:** NestJS `Logger` instantiated per service with `new Logger(ServiceName.name)`. Used for import parsing warnings, geocoding results, background task errors.

**Validation:** Class-validator DTOs globally enforced by `ValidationPipe`. Request body shape is validated before reaching service methods.

**Authentication:** Passport JWT strategy (`passport-jwt`). All LionsShare endpoints require `AuthGuard('jwt')` except `GET /api/hromadas` (public, for signup page hromada dropdown). The `Hromada` entity serves as both the auth subject and the data tenant.

---

*Architecture analysis: 2026-04-18*
