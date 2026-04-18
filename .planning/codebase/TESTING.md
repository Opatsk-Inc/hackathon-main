# Testing Patterns

**Analysis Date:** 2026-04-18

## Test Framework

**Runner:**
- Not configured. No test runner or test configuration files found in either `backend/` or `front/`.
- No `jest.config.*`, `vitest.config.*`, or equivalent files exist in the project.

**Assertion Library:**
- None configured.

**Run Commands:**
- No test scripts defined in `backend/package.json` or `front/package.json`.
- Backend `package.json` has `"jest": true` in the ESLint env (indicating Jest was intended), but no Jest configuration or test script exists.

## Test File Organization

**Location:**
- No test files exist anywhere in the codebase (no `*.test.*` or `*.spec.*` files found under `backend/src/` or `front/src/`).

**Naming:**
- Not applicable — no tests exist.

**Structure:**
- Not applicable.

## Test Structure

No tests are written. The backend ESLint config includes `env: { jest: true }`, and the NestJS scaffold typically ships with Jest configured, but the test scripts and config have been removed from `backend/package.json`.

## Mocking

**Framework:** Not in use.

**What would need mocking in future tests:**
- `PrismaService` — all backend services depend on it directly via constructor injection. In NestJS, mock using `createMockProvider` or manual provider override in `Test.createTestingModule()`
- `GeoService` — used by `AdminService` for background geocoding
- `JwtService` — used by `AuthService` for token signing
- `ApiClient` — all frontend service classes (`AdminService`, `AuthService`) delegate to the static `ApiClient` class, which uses `fetch` internally

## Fixtures and Factories

**Test Data:**
- No fixtures or factories exist.
- The database seed script at `backend/prisma/seed.ts` (run via `npx tsx prisma/seed.ts`) is the only data generation mechanism and is for development seeding, not testing.

**Location:**
- `backend/prisma/data/` — contains seed data files

## Coverage

**Requirements:** None enforced.

**Configuration:** No coverage tooling configured.

## Test Types

**Unit Tests:** None written.

**Integration Tests:** None written.

**E2E Tests:** Not configured.

## State of Testing: What Needs to Be Added

If tests are introduced, the following patterns apply to this codebase:

**Backend (NestJS + Jest recommended):**
```bash
# Install
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
```

Unit test structure for a NestJS service:
```typescript
// backend/src/admin/admin.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: { anomaly: { findMany: jest.fn(), aggregate: jest.fn() } } },
        { provide: GeoService, useValue: { geocodeAddress: jest.fn() } },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get(PrismaService);
  });

  it('should return dashboard metrics', async () => {
    // arrange, act, assert
  });
});
```

**Frontend (Vitest recommended, aligns with Vite):**
```bash
# Install
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

Hook test structure:
```typescript
// front/src/lib/hooks/useDashboardMetrics.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardMetrics } from './useDashboardMetrics'

// wrap with QueryClient provider in tests
```

## Critical Gaps

The entire codebase has zero test coverage. High-priority areas to add first:

1. `backend/src/common/anomaly-enrichment.ts` — pure function with branching risk logic, easiest to unit test
2. `backend/src/auth/auth.service.ts` — signup/login validation, error throwing
3. `backend/src/admin/admin.service.ts` — metrics aggregation logic (`getDashboardMetrics`)
4. `front/src/lib/api/client.ts` — `ApiClient` request/error handling behavior

---

*Testing analysis: 2026-04-18*
