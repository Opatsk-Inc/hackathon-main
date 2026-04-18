# Codebase Structure

**Analysis Date:** 2026-04-18

## Directory Layout

```
hackathon-main/
├── backend/                   # NestJS API server
│   ├── prisma/                # Database schema, migrations, seed data
│   │   ├── schema.prisma      # Prisma schema (single source of DB truth)
│   │   ├── migrations/        # Generated Prisma migration SQL files
│   │   └── data/              # Seed data files (land registry CSV/JSON)
│   ├── src/                   # Application source
│   │   ├── main.ts            # Bootstrap entry point
│   │   ├── app.module.ts      # Root NestJS module (imports all feature modules)
│   │   ├── app.controller.ts  # Root controller (health/misc)
│   │   ├── prisma/            # PrismaService — singleton DB client
│   │   ├── auth/              # JWT auth: signup, login, JwtStrategy, @Usr() decorator
│   │   ├── user/              # @Usr() param decorator, user.module.ts
│   │   ├── common/            # Cross-module utilities (anomaly-enrichment.ts)
│   │   ├── admin/             # Admin dashboard: metrics, discrepancies, task assignment
│   │   ├── import/            # File upload + anomaly detection engine
│   │   ├── mobile/            # Inspector mobile API: task list, resolve
│   │   ├── document/          # Inspection direction document generation
│   │   ├── hromada/           # Hromada listing, land records, anomalies (paginated)
│   │   └── geo/               # Nominatim geocoding service
│   └── dist/                  # Compiled output (generated, not committed)
├── front/                     # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── main.tsx           # React root mount, QueryClientProvider, ThemeProvider
│   │   ├── App.tsx            # BrowserRouter, route definitions, ProtectedRoute usage
│   │   ├── index.css          # Global styles (Tailwind CSS directives)
│   │   ├── assets/            # Static assets (images, svgs)
│   │   ├── components/        # Shared UI building blocks
│   │   │   ├── ui/            # Primitive UI components (button, card, chart, map, drawer, loading-spinner)
│   │   │   ├── layouts/       # Page layouts (HeadDesktopLayout, InspectorMobileLayout)
│   │   │   ├── ProtectedRoute.tsx   # Route guard component
│   │   │   └── theme-provider.tsx   # Dark/light theme context
│   │   ├── features/          # Domain feature slices
│   │   │   ├── auth/          # Login/signup hooks, Zustand auth store
│   │   │   ├── discrepancies/ # Anomaly list components (TopViolationsTable)
│   │   │   ├── import/        # File upload components/hooks (placeholder stubs)
│   │   │   └── tasks/         # Task management components/hooks (placeholder stubs)
│   │   ├── pages/             # Route-level page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── head/          # Desktop admin pages (DashboardPage, ImportPage, DiscrepanciesPage, TasksKanbanPage)
│   │   │   └── inspector/     # Mobile inspector pages (MobileTasksPage, TaskInspectionPage)
│   │   ├── lib/               # Shared utilities and API layer
│   │   │   ├── api/           # HTTP client + typed service classes
│   │   │   ├── hooks/         # Shared TanStack Query hooks (useDashboardMetrics)
│   │   │   └── constants/     # Route constants (routes.ts)
│   │   └── shared/            # Cross-feature shared types
│   │       └── types/         # index.ts with LandRecord, DiscrepancyTask, User interfaces
│   └── dist/                  # Vite build output (generated)
├── .planning/                 # Planning documents (this directory)
│   └── codebase/              # Codebase analysis documents
├── .claude/                   # Claude agent instructions
├── docker-compose.coolify.yml # Production deployment compose file
├── .env.coolify.example       # Example env vars for Coolify deployment
└── COOLIFY.md                 # Deployment documentation
```

## Directory Purposes

**`backend/src/prisma/`:**
- Purpose: NestJS-injectable Prisma client wrapper
- Contains: `prisma.service.ts` — extends `PrismaClient`, connects on module init
- Key files: `backend/src/prisma/prisma.service.ts`

**`backend/src/auth/`:**
- Purpose: Authentication and identity — JWT issuing, validation, hromada signup/login
- Contains: `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-payload.ts`, `auth-user.ts`, `models/` (request/response classes)
- Key files: `backend/src/auth/auth.service.ts`, `backend/src/auth/jwt.strategy.ts`

**`backend/src/common/`:**
- Purpose: Pure utility shared across backend modules (no controller, no module)
- Contains: `anomaly-enrichment.ts` — `enrichAnomaly()` function + `AnomalyEnrichment` interface
- Key files: `backend/src/common/anomaly-enrichment.ts`

**`backend/src/import/`:**
- Purpose: Real estate file ingestion and anomaly detection engine
- Contains: `import.controller.ts`, `import.service.ts`, `dto/request/`, `dto/response/`
- Key files: `backend/src/import/import.service.ts` — normalization functions `normalizeTaxId`, `normalizeName` are exported and used in seed scripts

**`backend/src/admin/`:**
- Purpose: Admin-facing API — dashboard metrics, discrepancy listing, task assignment
- Contains: `admin.controller.ts`, `admin.service.ts`, `dto/`
- Key files: `backend/src/admin/admin.service.ts`

**`backend/src/mobile/`:**
- Purpose: Inspector-facing mobile API — task list and task resolution
- Contains: `mobile.controller.ts`, `mobile.service.ts`, `dto/`
- Key files: `backend/src/mobile/mobile.service.ts`

**`backend/src/geo/`:**
- Purpose: External geocoding via Nominatim OpenStreetMap
- Contains: `geo.service.ts`, `geo.module.ts`
- Key files: `backend/src/geo/geo.service.ts`

**`backend/src/hromada/`:**
- Purpose: Hromada CRUD (public listing for signup, paginated land records and anomalies for authenticated access)
- Contains: `hromada.controller.ts`, `hromada.service.ts`, `hromada.module.ts`
- Key files: `backend/src/hromada/hromada.controller.ts`

**`backend/src/document/`:**
- Purpose: Generate inspection direction documents (Ukrainian "Направлення на перевірку") as base64-encoded text stubs
- Contains: `document.controller.ts`, `document.service.ts`
- Key files: `backend/src/document/document.service.ts`

**`front/src/components/ui/`:**
- Purpose: Primitive, reusable UI components. Not feature-specific.
- Contains: `button.tsx`, `card.tsx`, `chart.tsx` (Recharts wrapper), `drawer.tsx`, `loading-spinner.tsx`, `map.tsx` (MapLibre GL wrapper)
- Key files: `front/src/components/ui/map.tsx`

**`front/src/components/layouts/`:**
- Purpose: Full-page layout shells with navigation for each user role
- Contains: `HeadDesktopLayout.tsx` (sidebar nav for admin), `InspectorMobileLayout.tsx` (mobile header for inspectors)
- Key files: `front/src/components/layouts/HeadDesktopLayout.tsx`

**`front/src/features/`:**
- Purpose: Domain feature slices. Each feature exports `components`, `hooks`, and `types` via a barrel `index.ts`.
- Contains: auth (Zustand store + TanStack Query hooks), discrepancies (TopViolationsTable), import (stubs), tasks (stubs)
- Pattern: Every feature has `components/index.ts`, `hooks/index.ts`, `types/index.ts`, and a root `index.ts` that re-exports all three

**`front/src/lib/api/`:**
- Purpose: All backend communication. Static service classes that call `ApiClient`.
- Contains: `client.ts` (fetch wrapper), `auth.service.ts`, `admin.service.ts`, `types.ts` (response interfaces)
- Key files: `front/src/lib/api/client.ts`, `front/src/lib/api/admin.service.ts`

**`front/src/pages/`:**
- Purpose: Route-level page components. Import layouts, feature components, and lib hooks. Contain minimal local state only.
- Contains: Public pages (`LoginPage`, `SignupPage`, `HomePage`), head pages (`/head/*`), inspector pages (`/inspector/*`)

## Key File Locations

**Entry Points:**
- `backend/src/main.ts`: NestJS bootstrap — CORS, Validation, Helmet, Swagger, listen
- `front/src/main.tsx`: React root mount with QueryClient and ThemeProvider
- `front/src/App.tsx`: Route tree with ProtectedRoute guards

**Configuration:**
- `backend/prisma/schema.prisma`: Complete database schema for all models
- `backend/prisma/migrations/`: Sequential SQL migrations
- `front/src/lib/constants/routes.ts`: Canonical frontend route paths

**Core Business Logic:**
- `backend/src/import/import.service.ts`: `importRealEstate()` — the complete anomaly detection pipeline
- `backend/src/common/anomaly-enrichment.ts`: `enrichAnomaly()` — maps anomaly types to legal metadata
- `backend/src/admin/admin.service.ts`: `getDashboardMetrics()`, `getDiscrepancies()`, `assignTask()`
- `backend/src/geo/geo.service.ts`: `geocodeAddress()` — Nominatim integration with rate limit handling

**Auth:**
- `backend/src/auth/auth.service.ts`: `signup()`, `login()`, `validateUser()`
- `backend/src/auth/jwt.strategy.ts`: Passport strategy validates JWT and returns `AuthUser`
- `backend/src/user/user.decorator.ts`: `@Usr()` param decorator
- `front/src/features/auth/store/auth.store.ts`: Zustand store with `token` + `user` persistence

**API Layer (Frontend):**
- `front/src/lib/api/client.ts`: `ApiClient` — single fetch wrapper with auth token injection
- `front/src/lib/api/auth.service.ts`: `AuthService` — login, signup, getMe, getHromadas
- `front/src/lib/api/admin.service.ts`: `AdminService` — metrics, discrepancies, batches, assignTask, importRealEstate
- `front/src/lib/api/types.ts`: `DashboardMetrics`, `Anomaly`, `AnomalyListResponse`, `AnomalyEnrichment` interfaces

**Testing:**
- No test files detected in the codebase.

## Naming Conventions

**Files (Backend):**
- Feature modules: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`
- DTOs: `<action>-<entity>.request.dto.ts`, `<action>-<entity>.response.dto.ts`
- Models: descriptive noun files (`auth-user.ts`, `jwt-payload.ts`)

**Files (Frontend):**
- Pages: `PascalCase` + `Page.tsx` suffix (e.g., `DashboardPage.tsx`, `MobileTasksPage.tsx`)
- Components: `PascalCase.tsx` (e.g., `KPIStatCard.tsx`, `TopViolationsTable.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `useDashboardMetrics.ts`, `useAnimatedNumber.ts`)
- Stores: `<feature>.store.ts` (e.g., `auth.store.ts`)
- Services: `<feature>.service.ts` (e.g., `auth.service.ts`, `admin.service.ts`)

**Directories:**
- Backend modules: lowercase (`admin`, `import`, `mobile`, `geo`)
- Frontend features: lowercase (`auth`, `discrepancies`, `import`, `tasks`)
- Frontend pages: lowercase role grouping (`head/`, `inspector/`)

## Where to Add New Code

**New Backend Feature Module:**
- Create `backend/src/<feature>/` with `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`
- Add `dto/request/` and `dto/response/` subdirectories for DTO classes
- Register the new module in `backend/src/app.module.ts` imports array

**New Backend Endpoint on Existing Module:**
- Add method to `<feature>.controller.ts` with route decorator and Swagger annotations
- Add corresponding business logic method to `<feature>.service.ts`
- Create DTO classes in `dto/request/` or `dto/response/` as needed

**New Database Model:**
- Add model to `backend/prisma/schema.prisma`
- Run `npx prisma migrate dev --name <migration-name>` to generate migration
- Run `npx prisma generate` to update the Prisma client

**New Frontend Page:**
- Create `front/src/pages/<role>/<PageName>Page.tsx`
- Import the appropriate layout (`HeadDesktopLayout` or `InspectorMobileLayout`)
- Add route in `front/src/App.tsx` under the correct `ProtectedRoute` group
- Add route constant to `front/src/lib/constants/routes.ts`

**New Frontend Feature:**
- Create `front/src/features/<feature>/` with subdirectories: `components/`, `hooks/`, `types/`
- Add barrel `index.ts` files in each subdirectory
- Add root `index.ts` that re-exports `./types`, `./hooks`, `./components`

**New API Service Method (Frontend):**
- Add method to the appropriate service class in `front/src/lib/api/<feature>.service.ts`
- Add request/response interfaces to `front/src/lib/api/types.ts` if they don't exist
- Wrap in a TanStack Query hook in `front/src/features/<feature>/hooks/index.ts` or `front/src/lib/hooks/`

**Utilities / Shared Helpers:**
- Backend pure utilities: `backend/src/common/`
- Frontend shared types: `front/src/shared/types/index.ts`
- Frontend shared hooks: `front/src/lib/hooks/`
- Frontend route constants: `front/src/lib/constants/routes.ts`

## Special Directories

**`backend/prisma/data/`:**
- Purpose: Seed data files for land registry (large CSV/JSON files for Ukrainian hromadas)
- Generated: No — manually curated source data
- Committed: Yes (source of truth for land records)

**`backend/dist/`:**
- Purpose: TypeScript compiled output
- Generated: Yes (`tsc` build)
- Committed: Yes (currently committed, but typically excluded)

**`front/dist/`:**
- Purpose: Vite production build output
- Generated: Yes (`vite build`)
- Committed: Yes (currently committed, but typically excluded)

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents for Claude Code GSD workflow
- Generated: Yes (by GSD mapper)
- Committed: Yes

---

*Structure analysis: 2026-04-18*
