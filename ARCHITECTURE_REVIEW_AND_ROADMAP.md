# Architecture Review & Implementation Roadmap
_Generated: April 2026 — Perundhu v1.1.x_

---

## Is It Safe to Deploy to Production Right Now?

**Short answer: Yes, with caveats.**

The structural issues documented here are **maintenance debt**, not production blockers. The app works and users can perform the core journey: search bus route → view results → contribute. However, the following issues **directly affect real users today**:

| User-Facing Risk | Severity | Affects Who |
|---|---|---|
| Two JWT filters running independently — potential auth bypass | High | All authenticated users |
| No circuit breaker on Gemini/OSM — external failure takes down whole service | High | All users during any 3rd-party outage |
| No production alerting — team discovers outages from users | High | All users |
| Duplicate API calls due to no shared cache (React Query unused) | Medium | All users — slower search results, extra Cloud Run cold starts |
| In-memory rate limiter resets on pod cold-start, ineffective across instances | Medium | Security posture under scaled attack |
| Missing i18n keys silently show raw key strings (e.g. `contribution.submitRoute`) | Medium | Tamil-language users |
| No production error observability — silent failures invisible to team | High | All users — bugs go undetected |
| Incomplete offline support — partial Service Worker | Medium | Tamil Nadu users on 2G/intermittent networks |
| `ContributionService` bean instantiated at every startup but never used | Low | Negligible startup overhead |

**The SOLID violations (God components, fat port interfaces, duplicate JWT classes) do not cause runtime failures. They cause developer pain when adding features or debugging.**

---

## SOLID Violations — Detailed Findings

### S — Single Responsibility Principle

#### Backend: Contribution Service Explosion
**Location:** `backend/app/src/main/java/com/perundhu/application/service/`

Nine overlapping classes handle contribution logic:
```
ContributionService.java              ← @Service bean, injected nowhere (dead code)
ContributionApplicationService.java  ← delegates to ports
ContributionProcessingService.java   ← 8 inner status classes (ApprovedStatus, RejectedStatus, etc.)
ContributionQueryService.java
ContributionAdminService.java         ← has its own DashboardStats, ContributionStatus inner classes
RouteContributionService.java
RouteContributionValidationService.java
ImageContributionService.java
ImageContributionProcessingService.java
```

`ContributionProcessingService` carries status type definitions (`BatchIntegrationResult`, `DuplicateStatus`, `ApprovedStatus`, `RejectedStatus`, `PendingStatus`, `FailedStatus`) as inner classes. These belong in the domain model as a sealed interface or enum.

**Recommended fix:**
1. Delete `ContributionService.java` — it is a live Spring bean that is never injected (verified: only reference is commented-out code in `ContributionSecurityController`).
2. Move status types to `domain/model/ContributionStatus.java` (the file already exists — consolidate into it).
3. Establish a naming convention: `*ApplicationService` = orchestration, `*DomainService` = business rules, `*QueryService` = reads.

#### Backend: Duplicate JWT Infrastructure
**Location:** `infrastructure/security/`

Two classes do JWT work with no interface between them:
- `JwtTokenUtil` — used by `JwtRequestFilter`
- `JwtTokenProvider` — used by `JwtAuthenticationFilter`

This means two filters are independently validating tokens on every request. At best, one is redundant. At worst, they have diverging validation logic that could allow token bypass.

**Recommended fix:**
1. Audit which filter is actually registered in the Spring Security filter chain.
2. Extract a single `JwtPort` interface with `generateToken()` / `validateToken()` / `extractUsername()`.
3. Delete the unused concrete class and filter.

#### Backend: Duplicate Recaptcha Services
**Location:** `infrastructure/security/`
- `RecaptchaService.java`
- `RecaptchaValidationService.java`

**Recommended fix:** Consolidate into one service behind a `RecaptchaPort` interface in `domain/port/`.

#### Frontend: God Component — TransitSearchForm
**Location:** `frontend/src/components/TransitSearchForm.tsx` (2,276 lines, 46 hook calls)

One component handles simultaneously:
- GPS geolocation + permission negotiation
- From/To autocomplete with independent highlight indices
- Recent searches (localStorage read/write)
- Dynamic suggestion fetching + debounce timer
- Schedule modal + schedule data fetching
- Map picker modal
- Suggestions overflow modal
- Form validation

**Recommended decomposition:**
```
hooks/
  useLocationAutocomplete.ts    ← from/to suggestion state + keyboard navigation
  useRecentSearches.ts          ← localStorage reads/writes
  useGPSLocation.ts             ← geolocation + permission state
  useScheduleModal.ts           ← schedule fetch + modal state
components/
  search/
    LocationInputField.tsx      ← single autocomplete field (used twice)
    ScheduleModal.tsx
    MapPickerModal.tsx
    TransitSearchForm.tsx       ← orchestrator only, ~200 lines
```

#### Frontend: Monolithic API Module
**Location:** `frontend/src/services/api.ts` (1,402 lines)

One file owns: HTTP client config, interceptors, CSRF management, error class definitions, pagination types, and every domain's API calls (buses, stops, locations, contributions, tracking, rewards, admin).

**Recommended decomposition:**
```
services/
  http/
    axiosInstance.ts            ← client config + interceptors (single responsibility)
    apiError.ts                 ← ApiError class + types
  busService.ts                 ← bus search + schedule endpoints
  locationService.ts            ← location + autocomplete endpoints (merge with existing)
  contributionService.ts        ← route + image contribution endpoints
  trackingService.ts            ← bus tracking endpoints
  adminApiService.ts            ← admin endpoints
```

#### Frontend: Monolithic StaticPages Component
**Location:** `frontend/src/components/StaticPages.tsx` (674 lines)

Renders Privacy Policy, About, Terms, etc. from a single file. Every new page requires modifying it.

**Recommended fix:** One file per static page in `components/static/PrivacyPage.tsx`, etc.

---

### O — Open/Closed Principle

#### Frontend: StaticPages.tsx
As above — adding a page requires modifying the existing file.

#### Backend: Exception handling
`AdminExceptionHandler` in `adapter/in/rest/exception/` is the right pattern. However, verify all controllers delegate to it rather than using inline try/catch. New error types should extend the handler without modifying controllers.

---

### L — Liskov Substitution Principle

#### Backend: BusScheduleService + BusScheduleServiceImpl
Both exist in `application/service/`. Controllers must inject the **interface** (`BusScheduleService`) only, never the concrete `BusScheduleServiceImpl`. If any controller injects the concrete class directly, swapping implementations (e.g., for testing) breaks.

**Recommended fix:** Audit all injection points. Rename the interface to `BusScheduleUseCase` (aligns with hexagonal naming) to make the intent clear.

---

### I — Interface Segregation Principle

#### Backend: Fat Port Interfaces Not Cleaned Up
When ports were segregated into Input/Output variants, the original fat interfaces were left in place:

```
domain/port/RouteContributionPort.java        ← SHOULD BE DELETED
domain/port/RouteContributionInputPort.java   ← keep
domain/port/RouteContributionOutputPort.java  ← keep

domain/port/ImageContributionPort.java        ← SHOULD BE DELETED
domain/port/ImageContributionInputPort.java   ← keep
domain/port/ImageContributionOutputPort.java  ← keep
```

Similarly, `application/port/in/AdminUseCase.java` and `application/port/input/ImageContributionInputPort.java` duplicate what `domain/port/` already defines. Ports belong in `domain/port/` only; the `application/port/` directory should either be removed or clearly own a distinct layer.

**Recommended fix:**
1. Delete `RouteContributionPort.java` and `ImageContributionPort.java`.
2. Verify no class implements the fat interfaces (grep for `implements RouteContributionPort`).
3. Delete `application/port/` directory after migrating to `domain/port/`.

---

### D — Dependency Inversion Principle

#### Frontend: No HTTP Abstraction
Components and hooks import directly from `services/api.ts` (a concrete module). There is no interface/contract. In tests, the entire module is mocked rather than a fake implementation being injected.

**Recommended fix:** Adopt React Query (`queryClient.ts` already exists but is minimally used). Define a query-key registry:
```typescript
// lib/queryKeys.ts
export const queryKeys = {
  busRoutes: (from: string, to: string) => ['busRoutes', from, to] as const,
  locations: (query: string) => ['locations', query] as const,
  // ...
}
```
Components then depend on the query key contract, not the HTTP function directly.

#### Frontend: No Shared Server-State Cache
The same API endpoint is called independently from multiple components because there is no shared cache layer. This has a direct cost impact: extra Cloud Run invocations.

**React Query is already in the project** (`frontend/src/lib/queryClient.ts`). The migration path is incremental — wrap existing fetch calls in `useQuery` one service at a time, starting with location autocomplete (the highest-frequency call).

---

## Non-SOLID Issues — Broader Product Architecture

### 1. Production Error Observability — Critical Gap
**Current state:** `logger.ts` and `structuredLogger.ts` log to browser console only. Backend uses `LoggerUtil` / `StructuredLogger` but GCP Logging integration is not confirmed end-to-end.

**Impact:** Real user errors (failed searches, broken contributions) are completely invisible to the team.

**Fix:** Enable GCP Error Reporting (zero additional cost — already in GCP project `perundhu-prod-001`). Add one line to the root `ErrorBoundary`:
```typescript
// In ErrorBoundary.tsx catch block
if (window._gaq || import.meta.env.PROD) {
  // POST to /api/v1/errors or use GCP Logging client
}
```
On the backend, configure `spring.cloud.gcp.logging.enabled=true` — already supported by the Spring Cloud GCP dependency if present.

### 2. No OpenAPI Contract Between Frontend and Backend
Backend DTOs and frontend `types/` are maintained separately. A renamed DTO field silently breaks the frontend at runtime with no compile-time warning.

**Fix:**
1. Add `springdoc-openapi-starter-webmvc-ui` to `build.gradle` (free, zero infra cost).
2. Add `openapi-typescript` as a dev dependency in the frontend.
3. Add to CI: generate types from spec and fail the build if the generated file differs from committed types.

**Cost:** Zero. CI time adds ~20 seconds.

### 3. i18n Coverage is Untested
Translation key gaps cause raw key strings (e.g. `contribution.submitRoute`) to be shown to Tamil-language users. This was discovered during Playwright testing.

**Fix:** Add a pre-commit / CI check:
```bash
# Compare key sets between en and ta locale files
node -e "
  const en = Object.keys(require('./public/locales/en/translation.json'));
  const ta = Object.keys(require('./public/locales/ta/translation.json'));
  const missing = en.filter(k => !ta.includes(k));
  if (missing.length) { console.error('Missing ta keys:', missing); process.exit(1); }
"
```

### 4. Feature-Folder Structure for Frontend
The flat `components/` directory with 40+ top-level files will become unnavigable as features are added.

**Target structure (no breaking changes, migrate incrementally):**
```
components/
  search/         ← TransitSearchForm, SearchResults, RouteResults
  bus/            ← BusCardModern, TransitBusList, TransitBusCard, BusCardModern
  map/            ← MapComponent, RouteMap, OpenStreetMapComponent, FallbackMapComponent
  tracking/       ← BusTracker, LiveBusTracker, CombinedMapTracker
  layout/         ← Header, Footer, BottomNavigation, MainTabNavigation
  contribution/   ← already exists ✓
  admin/          ← already exists ✓
  shared/         ← Loading, ErrorBoundary, ToastProvider, NetworkStatusIndicator
```

### 5. Offline-First Completeness
`useOfflinePersistence.ts` and `offlinePersistenceService.ts` exist but the coverage is partial. For Tamil Nadu users on 2G:

**Minimum viable offline:**
- Cache the last successful location list (for autocomplete)
- Cache the last search result
- Show a clear "You're offline — showing last known results" message

The hooks exist. The gap is that they are not consistently invoked from `TransitSearchForm`.

### 6. Accessibility (a11y) — Legal & Ethical
Admin modals use `<div role="dialog">` instead of `<dialog>`. Public-facing modals (search, schedule) should be audited. India's Rights of Persons with Disabilities Act 2016 requires digital public services to be accessible. A bus finder is a civic utility.

**Minimum fixes:**
- Replace `<div role="dialog">` with `<dialog>` or add `aria-modal="true"` and focus trapping.
- Ensure all icon-only buttons have `aria-label`.
- Test with macOS VoiceOver on the search form.

---

## Implementation Roadmap

### Phase 1 — Zero-Risk Cleanup (1–2 days, no user impact)
These are safe to do in any order and have zero risk of regression:

- [ ] Delete `ContributionService.java` (confirmed dead — no injections, bean is orphaned)
- [ ] Delete `RouteContributionPort.java` and `ImageContributionPort.java` (confirm no implementors first)
- [ ] Delete `application/port/` directory after confirming `domain/port/` is the single source
- [ ] Add GCP Error Reporting to root `ErrorBoundary`
- [ ] Add i18n key coverage check to CI

### Phase 2 — Core Maintainability (1 week, low regression risk)
- [ ] Audit and consolidate `JwtTokenUtil` vs `JwtTokenProvider` into one class + one filter
- [ ] Merge `RecaptchaService` + `RecaptchaValidationService` into one
- [ ] Add `springdoc-openapi` to backend + `openapi-typescript` to frontend
- [ ] Delete `StaticPages.tsx` — extract to individual page components

### Phase 3 — Frontend Architecture (2 weeks, medium regression risk — needs test coverage)
- [ ] Extract custom hooks from `TransitSearchForm` (start with `useGPSLocation` and `useRecentSearches` — fully self-contained)
- [ ] Split `api.ts` into domain-scoped service files
- [ ] Adopt React Query for location autocomplete (highest frequency, clearest cache benefit)
- [ ] Migrate `components/` to feature-folder structure (path aliases prevent import breaks)

### Phase 4 — Product Quality (ongoing)
- [ ] Complete offline-first support in `TransitSearchForm` using existing `useOfflinePersistence`
- [ ] Accessibility audit — modal focus trapping, icon button labels
- [ ] Contribution domain — consolidate 9 services into 3 using clear naming convention

---

## What NOT to Change (Cost-Locked)
Per the project budget constraint ($25–30/month), the following must not be changed without explicit cost justification:
- `cloud_run_min_instances = 0` (scale-to-zero)
- `db-f1-micro` Cloud SQL tier
- VPC Connector disabled
- React Query adoption is **cost-reducing** (fewer Cloud Run invocations) — safe to proceed

---

_All findings in this document are based on static analysis of the codebase as of April 2026. No production data or runtime profiling was used._
