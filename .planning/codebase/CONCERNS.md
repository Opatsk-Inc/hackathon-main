# Codebase Concerns

**Analysis Date:** 2026-04-18

## Tech Debt

**Duplicated normalization functions:**
- Issue: `normalizeTaxId` and `normalizeName` are copy-pasted verbatim in two files with a comment explicitly warning they must stay in sync.
- Files: `backend/src/import/import.service.ts` (lines 11-33), `backend/prisma/seed.ts` (lines 14-29)
- Impact: Future changes to normalization logic must be applied twice manually. A divergence will silently break cross-registry matching.
- Fix approach: Extract shared functions to `backend/src/common/normalization.ts` and import from both locations.

**Stale Prisma schema with unused models:**
- Issue: The Prisma schema (`backend/prisma/schema.prisma`) retains the full original data models — `User`, `Warehouse`, `Resource`, `Inventory`, `Order`, `Trip`, `TripPoint` — from a prior project, alongside the LionsShare models. These tables exist in the database but are entirely unused by the current application logic.
- Files: `backend/prisma/schema.prisma` (lines 1-110)
- Impact: Confusing schema, unnecessary migration surface area, and increased seed complexity. The unused `user` table also has a separate auth model from `Hromada`, creating two parallel identity systems.
- Fix approach: Remove or comment out the unused model block and create a migration to drop those tables.

**Unused UserController:**
- Issue: `backend/src/user/user.controller.ts` is an empty class with no routes or logic.
- Files: `backend/src/user/user.controller.ts`
- Impact: Dead code that implies a user management API exists when it does not.
- Fix approach: Remove the controller and `UserModule` or implement the intended functionality.

**`ViewMode` type declared inside component body:**
- Issue: In `MobileTasksPage.tsx`, the `type ViewMode = "map" | "list"` declaration appears inside the function body at line 89, after it is already used as the generic argument for `useState` on line 73.
- Files: `front/src/pages/inspector/MobileTasksPage.tsx`
- Impact: Type is effectively redundant and out of order; the component already works by inference, but this is misleading.
- Fix approach: Move the type declaration to the top of the file or remove it entirely since TypeScript infers it correctly.

**`inspectorId` typed as `number` in frontend but `string` in backend:**
- Issue: `AdminService.assignTask` accepts `inspectorId: number` in the frontend, but the backend DTO and Prisma schema treat `inspectorId` as a `string` (UUID). The frontend API call sends a number where the backend expects a UUID string.
- Files: `front/src/lib/api/admin.service.ts` (line 18), `backend/src/admin/dto/request/assign-task.request.dto.ts` (line 7)
- Impact: Task assignment will silently pass the wrong type; the inspector ID stored in the anomaly record will be a stringified integer, not a valid UUID.
- Fix approach: Change the frontend type to `string` and ensure the correct UUID is passed.

## Known Bugs

**`CANCELLED` status sent by frontend does not exist in backend enum:**
- Symptoms: When an inspector resolves a task as not-confirmed, `TaskInspectionPage.tsx` sends `status: "CANCELLED"`, but `AnomalyStatus` enum only has `NEW`, `IN_PROGRESS`, `RESOLVED`. The `ResolveTaskRequestDto` also validates against only `IN_PROGRESS` and `RESOLVED`.
- Files: `front/src/pages/inspector/TaskInspectionPage.tsx` (line 47), `backend/src/mobile/dto/request/resolve-task.request.dto.ts` (line 11), `backend/prisma/schema.prisma`
- Trigger: Inspector taps "Not confirmed" on the inspection page.
- Workaround: None. The API call will return a 400 validation error and the `.catch(() => null)` silently swallows it, making it appear to succeed.

**Mobile inspector tasks page uses hardcoded mock data:**
- Symptoms: `MobileTasksPage.tsx` renders from a local `mockTasks` array rather than fetching from `GET /api/mobile/tasks`. The real API endpoint exists and returns data, but is not called.
- Files: `front/src/pages/inspector/MobileTasksPage.tsx` (lines 42-70, 232, 394)
- Trigger: Any inspector visiting the tasks page.
- Workaround: Manually hit the API endpoint. There is no in-app way to see real tasks.

**`TaskInspectionPage` fetches all tasks to find one by ID:**
- Symptoms: `ApiClient.get<Anomaly[]>("/api/mobile/tasks")` is called without an `inspectorId` query param, so the backend receives an empty string as `inspectorId` and returns nothing. The page always shows "Завдання не знайдено" when using real data.
- Files: `front/src/pages/inspector/TaskInspectionPage.tsx` (lines 38-40)
- Trigger: Navigating to `/inspector/tasks/:id`.
- Workaround: None under current architecture; needs a dedicated `GET /api/mobile/tasks/:id` endpoint or correct inspector ID injection.

## Security Considerations

**No file size limit on uploads:**
- Risk: The file upload endpoint at `POST /api/import/real-estate` uses `FileInterceptor('file')` with no configured `limits` or `fileSize` option. An authenticated user can upload arbitrarily large files.
- Files: `backend/src/import/import.controller.ts` (line 46), `backend/src/import/import.module.ts`
- Current mitigation: Authenticated endpoint only (JWT required).
- Recommendations: Add `{ limits: { fileSize: 50 * 1024 * 1024 } }` to the `FileInterceptor` options.

**JWT secret loaded without validation at startup:**
- Risk: `process.env.JWT_SECRET!` is accessed with a non-null assertion in both `auth.module.ts` and `jwt.strategy.ts`. If the environment variable is absent, the JWT module silently uses `undefined` as the secret until the first request hits the auth path.
- Files: `backend/src/auth/auth.module.ts` (line 15), `backend/src/auth/jwt.strategy.ts` (line 14)
- Current mitigation: None at startup.
- Recommendations: Add a startup validation guard using `@nestjs/config` schema validation or an explicit check in `bootstrap()`.

**CORS whitelist includes multiple localhost ports:**
- Risk: Development origins (`localhost:3000`, `3001`, `3002`, `5173`, `5174`) are present in the production CORS config.
- Files: `backend/src/main.ts` (lines 11-19)
- Current mitigation: None; all listed origins are always allowed regardless of environment.
- Recommendations: Use `process.env.CORS_ORIGINS` split by comma, defaulting to the production domain only.

**No authorization check on `resolveTask`:**
- Risk: The `PATCH /api/mobile/tasks/:id/resolve` endpoint only requires a valid JWT. Any authenticated hromada head can resolve any inspector's task by knowing the anomaly UUID.
- Files: `backend/src/mobile/mobile.controller.ts`, `backend/src/mobile/mobile.service.ts`
- Current mitigation: Anomaly UUIDs are not publicly discoverable.
- Recommendations: Verify that `anomaly.inspectorId` matches the requesting user's ID before allowing the update.

**`auth_token` stored in both Zustand persist (`localStorage`) and explicit `localStorage.setItem`:**
- Risk: Token is written to localStorage twice via two separate mechanisms. The `logout` function removes the key manually, but the Zustand persist store may restore it on next session if clearing is out of sync.
- Files: `front/src/features/auth/store/auth.store.ts` (lines 21-22, 27-29)
- Current mitigation: Not a security bypass, but a state management inconsistency.
- Recommendations: Remove the explicit `localStorage.setItem`/`removeItem` calls and rely solely on Zustand's `persist` middleware.

## Performance Bottlenecks

**Unbounded `landRecord.findMany` in import pipeline:**
- Problem: During import, all land records for a hromada are loaded into application memory with no `take` limit. Large communities may have tens of thousands of records.
- Files: `backend/src/import/import.service.ts` (lines 170-173)
- Cause: Cross-matching between two datasets requires holding both in memory simultaneously.
- Improvement path: For large datasets, consider streaming or batching the land record query, or move the matching logic into a SQL JOIN.

**Serial geocoding with 1.1-second sleep per anomaly:**
- Problem: `geocodeAssignedAnomalies` loops anomalies sequentially with a 1100ms sleep between each call to respect Nominatim rate limits.
- Files: `backend/src/admin/admin.service.ts` (lines 152-178)
- Cause: Nominatim's usage policy prohibits concurrent requests from a single user.
- Improvement path: Move geocoding to a background job queue (e.g., Bull/BullMQ), so it doesn't block the response and can be retried. Alternatively, switch to a commercial geocoding API that supports concurrent requests.

**Dashboard loads all anomalies for type-counting:**
- Problem: `getDashboardMetrics` runs `prisma.anomaly.findMany({ where: { hromadaId }, select: { type: true } })` to build a type frequency map in application code instead of using a `groupBy` query.
- Files: `backend/src/admin/admin.service.ts` (lines 25-28)
- Cause: Manual aggregation in Node.js instead of pushing to the database.
- Improvement path: Replace with `prisma.anomaly.groupBy({ by: ['type'], where: { hromadaId }, _count: { type: true } })`.

**Discrepancies endpoint hard-caps at 1000 records with no pagination:**
- Problem: `getDiscrepancies` takes only the first 1000 anomalies (`take: 1000`) and returns all of them in one response. There is no cursor or page-based pagination.
- Files: `backend/src/admin/admin.service.ts` (line 114)
- Cause: Commented as "Limit to 1000 records for performance" but this is an arbitrary cap, not a proper pagination strategy.
- Improvement path: Add `page`/`limit` or cursor parameters to the endpoint and matching query params to the frontend call.

## Fragile Areas

**Area mismatch cross-matching uses O(n×m) `.find()` loop:**
- Files: `backend/src/import/import.service.ts` (lines 329-358)
- Why fragile: For each real estate record, a linear scan of all land records is performed with `landRecords.find(...)`. With large datasets this degrades to O(n×m) and will cause request timeouts.
- Safe modification: Build Map lookups for land records by `taxId` and `ownerNameNorm` (as is done for real estate in step 3) and reuse them in steps 10 and 11.
- Test coverage: Zero — no unit tests cover the anomaly detection logic.

**`parseLocation` heuristic for hromada name extraction:**
- Files: `backend/prisma/seed.ts` (lines 35-51)
- Why fragile: Community names are extracted from a Ukrainian string by comma-splitting and position. The logic has a street keyword filter that falls back to district or region when triggered. Non-standard location strings will silently produce wrong hromada names, causing all subsequent import matching to fail for that community.
- Safe modification: Validate extracted names against a known reference list or add explicit logging for fallback cases.
- Test coverage: Zero.

**`normalizeTaxId` strips leading zeros — collisions possible:**
- Files: `backend/src/import/import.service.ts` (line 14), `backend/prisma/seed.ts` (line 15)
- Why fragile: Leading-zero stripping is applied to both datasets. If two different tax IDs differ only by leading zeros (a real edge case with legacy data), they will be treated as the same owner, causing false positive anomaly matches.
- Safe modification: Log a warning when normalization produces a very short ID (less than 8 digits) to surface potential data quality issues.

## Scaling Limits

**Nominatim (free OSM geocoding):**
- Current capacity: 1 request per second enforced by 1100ms sleep.
- Limit: Nominatim usage policy prohibits high-volume automated geocoding and may block the server IP.
- Scaling path: Replace with a commercial geocoding service (Google Maps, HERE, Geoapify) or self-host a Nominatim instance.

**Single-batch import replaces all existing data:**
- Current capacity: Each import deletes all anomalies, real estate records, and batches for the hromada before re-inserting.
- Limit: Destructive on every import — no history is preserved. If an import fails mid-way, partial data may be left in inconsistent state.
- Scaling path: Wrap the delete-and-reinsert in a database transaction (`prisma.$transaction`).

## Dependencies at Risk

**Nominatim (external free service):**
- Risk: The geocoding pipeline depends on `nominatim.openstreetmap.org`, a free public service with no SLA. It actively rate-limits abusive users.
- Impact: Geocoding silently fails for assigned anomalies, leaving `lat`/`lng` as `null` and map pins invisible.
- Migration plan: Switch to a self-hosted Nominatim instance or a commercial API.

**`OSRM` public routing API for navigation:**
- Risk: `MobileTasksPage.tsx` calls `https://router.project-osrm.org/route/v1/driving/...`, a public demo server with no SLA or authentication.
- Files: `front/src/pages/inspector/MobileTasksPage.tsx` (line 153)
- Impact: If the demo server is down or rate-limits the IP, navigation silently falls back to a straight line.
- Migration plan: Self-host OSRM, or use Mapbox Directions / Google Routes API.

## Missing Critical Features

**No role-based access control (RBAC):**
- Problem: Both the head/admin routes and the inspector/mobile routes use the same `AuthGuard('jwt')`. Any authenticated hromada can access the inspector endpoints and vice versa. There is no `role` field on `Hromada` or separation of token scopes.
- Blocks: Cannot safely deploy both interfaces publicly without risk of cross-role data access.

**No inspector identity model:**
- Problem: The `inspectorId` field on `Anomaly` stores an arbitrary string (currently a hardcoded number from the frontend). There is no `Inspector` model, no inspector authentication, and no way to list or manage inspectors.
- Files: `backend/prisma/schema.prisma`, `front/src/lib/api/admin.service.ts`
- Blocks: The assignment and mobile task features are effectively non-functional end-to-end.

**No error boundary or global error handling in frontend:**
- Problem: API errors in React components are handled inconsistently — some use `.catch(() => null)` (silently ignored), some display inline error states, and some use `alert()`. There is no global error boundary.
- Files: `front/src/pages/inspector/TaskInspectionPage.tsx` (line 49), `front/src/pages/inspector/MobileTasksPage.tsx` (line 142)
- Blocks: Production debugging is difficult; silent failures mislead users.

## Test Coverage Gaps

**Zero tests across the entire codebase:**
- What's not tested: All business logic — anomaly detection, name normalization, area mismatch calculation, geocoding, auth, import pipeline.
- Files: Entire `backend/src/` tree and `front/src/` tree.
- Risk: Any refactor or bug fix has no safety net. The anomaly detection algorithm (the core feature) is particularly high-risk.
- Priority: High. The import and anomaly detection logic in `backend/src/import/import.service.ts` should be unit tested first.

---

*Concerns audit: 2026-04-18*
