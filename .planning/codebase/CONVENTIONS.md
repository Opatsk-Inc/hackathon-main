# Coding Conventions

**Analysis Date:** 2026-04-18

## Naming Patterns

**Files (Backend):**
- Controllers: `[domain].controller.ts` (e.g., `admin.controller.ts`, `auth.controller.ts`)
- Services: `[domain].service.ts` (e.g., `admin.service.ts`, `mobile.service.ts`)
- Modules: `[domain].module.ts` (e.g., `import.module.ts`)
- DTOs (request): `[action].[domain].request.dto.ts` (e.g., `assign-task.request.dto.ts`, `import-real-estate.request.dto.ts`)
- DTOs (response): `[domain].[resource].response.dto.ts` (e.g., `dashboard-metrics.response.dto.ts`, `anomaly-list.response.dto.ts`)
- Auth models (exception): `[action].request.ts` without `.dto` suffix (e.g., `login.request.ts`, `signup.request.ts`)
- Decorators: `[domain].decorator.ts` (e.g., `user.decorator.ts`)
- Guards/strategies: `[name].strategy.ts` (e.g., `jwt.strategy.ts`)

**Files (Frontend):**
- React components (pages): `PascalCase.tsx` (e.g., `LoginPage.tsx`, `DashboardPage.tsx`)
- React components (UI): `kebab-case.tsx` (e.g., `loading-spinner.tsx`, `button.tsx`)
- Feature hooks: all consolidated in `index.ts` per feature
- Stores: `[domain].store.ts` (e.g., `auth.store.ts`)
- API services: `[domain].service.ts` (e.g., `admin.service.ts`, `auth.service.ts`)

**Classes/Components:**
- Backend service classes: PascalCase suffixed with `Service`, `Controller`, `Module`, `Dto`
- Frontend: React component functions use PascalCase (`function TopViolationsTable()`, `function Button()`)
- Frontend service classes: PascalCase static-only classes (e.g., `ApiClient`, `AdminService`, `AuthService`)
- Zustand stores: exported as camelCase hooks prefixed `use` (e.g., `useAuthStore`)

**Functions (Frontend):**
- React hooks: `useXxx` prefix (e.g., `useLogin`, `useSignup`, `useDashboardMetrics`, `useLogout`)
- Utility functions: camelCase (e.g., `extractStreetAddress`, `cn`)
- Component-internal helpers: camelCase (e.g., `calculateTrend`)

**Variables:**
- camelCase throughout both backend and frontend
- Constants and config maps: UPPER_SNAKE_CASE (e.g., `RISK_COLORS`, `RISK_CONFIG`, `TYPE_LABELS`, `ENRICHMENT_MAP`, `PROD_API_URL`)

**Types/Interfaces:**
- Backend DTOs: PascalCase class with `Dto` suffix
- Frontend interfaces: PascalCase without suffix (e.g., `DashboardMetrics`, `Anomaly`, `AnomalyEnrichment`)
- Enums: come from Prisma client, UPPER_SNAKE_CASE values (e.g., `AnomalyStatus.IN_PROGRESS`, `AnomalyType.MISSING_IN_LAND`)

## Code Style

**Backend Formatting (Prettier):**
- Single quotes: `true`
- Trailing commas: `all`
- Applied via `eslint-plugin-prettier`

**Frontend Formatting (Prettier):**
- Double quotes: `false` (no double quotes — uses the default: no forced quotes means double is default but frontend uses no-semi style)
- Semi: `false` (no semicolons in frontend)
- Single quote: `false`
- Tab width: `2`
- Trailing commas: `es5`
- Print width: `80`
- Tailwind CSS class sorting via `prettier-plugin-tailwindcss`
- Tailwind functions recognized: `cn`, `cva`
- End of line: `lf`

**Note:** Backend uses semicolons (TypeScript default); frontend uses no-semicolon style. These differ between projects.

**Backend Linting:**
- `@typescript-eslint/recommended` + `plugin:prettier/recommended`
- `@typescript-eslint/no-explicit-any`: off (any is permitted)
- `@typescript-eslint/explicit-function-return-type`: off
- `@typescript-eslint/explicit-module-boundary-types`: off
- Jest globals enabled in ESLint env

**Frontend Linting:**
- `typescript-eslint` recommended + `react-hooks` + `react-refresh`
- ESM config format (`eslint.config.js` with `defineConfig`)

## Import Organization

**Backend (NestJS standard):**
1. NestJS framework imports (`@nestjs/common`, `@nestjs/swagger`, etc.)
2. Passport/auth libs (`@nestjs/passport`)
3. Internal services/modules (relative paths, `../domain/domain.service`)
4. DTOs (relative paths within same feature folder)
5. Common/shared utilities (`../common/...`)
6. Prisma client types (`@prisma/client`)

**Frontend:**
1. React core (`react`, `react-dom`)
2. Third-party libraries (`@tanstack/react-query`, `@tanstack/react-table`, `react-router-dom`, etc.)
3. UI components (path alias `@/components/...`)
4. Feature modules (path alias `@/features/...` or `@/lib/...`)
5. Local relative imports

**Path Aliases:**
- Frontend: `@/` maps to `src/` (configured in Vite/tsconfig)
- Backend: No path aliases; uses relative paths only

## Error Handling

**Backend:**
- Throw NestJS built-in HTTP exceptions directly in service methods:
  ```typescript
  throw new NotFoundException('Hromada not found');
  throw new ConflictException('This hromada already has an account');
  throw new UnauthorizedException('Invalid email or password');
  ```
- No try/catch wrappers around normal service operations; exceptions propagate to NestJS global filter
- Background fire-and-forget operations use `.catch()`:
  ```typescript
  this.geocodeAssignedAnomalies(dto.anomalyIds).catch((e) =>
    this.logger.error(`Background geocoding failed: ${e.message}`),
  );
  ```

**Frontend:**
- API errors thrown as `Error` with format `"${status}::${body}"` from `ApiClient`
- React Query mutations swallow expected errors silently with empty catch blocks:
  ```typescript
  try {
    const me = await AuthService.getMe()
    setUser(me)
  } catch {
    // ignore, token is still set
  }
  ```
- `console.error` used only for browser API errors (geolocation, route fetching) — not for application logic

## Logging

**Backend:**
- NestJS `Logger` class used, instantiated as `private readonly logger = new Logger(ServiceName.name)`
- Log levels used: `this.logger.log()` for info, `this.logger.warn()` for soft failures, `this.logger.error()` for background errors
- Log pattern: `logger.log(`Geocoded anomaly ${id}: ${lat}, ${lng}`)`
- Only `AdminService` uses Logger; other services have no logging

**Frontend:**
- No structured logging library; `console.error` used sparingly for browser API failures only (geolocation, routing)

## Comments

**When to Comment:**
- Inline comments explain non-obvious intent: `// Limit to 1000 records for performance`
- `eslint-disable` comments used when prettier conflicts with long Ukrainian strings: `/* eslint-disable prettier/prettier */`
- JSDoc used only on custom decorators (e.g., `user.decorator.ts` has full usage example comment)
- Brief comments describe sections within complex components: `{/* Кримінальна відповідальність */}`

**JSDoc/TSDoc:**
- Used only on `@Usr` custom decorator in `backend/src/user/user.decorator.ts`
- Not used on service methods or controller actions (Swagger decorators serve as documentation instead)

## Function Design

**Backend services:** Async methods returning typed Promises. Each method handles one domain operation. Methods lean on Prisma for data access without abstraction layers.

**Frontend hooks:** Each hook wraps exactly one React Query `useQuery` or `useMutation` call. Hooks handle navigation side-effects (`useNavigate`) directly.

**Frontend components:** Components fetch their own data using `useQuery` (no prop drilling of data). Modal sub-components are defined locally in the same file.

## Module Design

**Backend:**
- Each domain has its own NestJS module: `[domain].module.ts`
- Modules are feature-sliced: controller + service + DTOs co-located per domain
- DTOs split into `dto/request/` and `dto/response/` subdirectories

**Frontend:**
- Feature-based: `features/[domain]/` contains `components/`, `hooks/`, `types/`, `index.ts`
- Many feature subdirectories are stubs with placeholder exports (`// Placeholder for tasks hooks`)
- Shared UI: `components/ui/` for shadcn-style primitives, `components/layouts/` for layout wrappers
- API services: `lib/api/` contains `client.ts`, `types.ts`, and per-domain `[domain].service.ts` files

**Exports:**
- Feature directories export via `index.ts` barrel files
- Backend DTOs do not use barrel files — imported directly by path
- Frontend UI components export named exports (e.g., `export { Button, buttonVariants }`)

## Backend DTO Validation Pattern

All request DTOs use `class-validator` decorators for validation and `@nestjs/swagger` `@ApiProperty` for documentation:

```typescript
export class AssignTaskRequestDto {
  @ApiProperty({ example: 'inspector-uuid-123', description: 'Inspector user ID' })
  @IsString()
  inspectorId: string;

  @ApiProperty({ type: [String], example: ['uuid-1'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  anomalyIds: string[];
}
```

Use `@Type(() => Number)` from `class-transformer` for coercing multipart form string fields to numbers.

## Frontend Static Service Pattern

API services are static-method-only classes wrapping `ApiClient`:

```typescript
export class AdminService {
  static getDashboardMetrics(): Promise<DashboardMetrics> {
    return ApiClient.get<DashboardMetrics>('/api/admin/dashboard/metrics')
  }
}
```

These are never instantiated — called directly as `AdminService.getDiscrepancies()`.

## Tailwind Utility Composition

Use the `cn()` utility from `src/lib/utils.ts` for all conditional class merging:

```typescript
import { cn } from "@/lib/utils"
className={cn(buttonVariants({ variant, size, className }))}
```

Complex Tailwind strings for color variants defined as `Record<string, string>` constants at module top level.

---

*Convention analysis: 2026-04-18*
