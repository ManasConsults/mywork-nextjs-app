# Test Strategy Document

## Work Management Application — *MyWork*

| Field          | Value                                        |
|----------------|----------------------------------------------|
| Document ID    | TS-001                                       |
| Version        | 1.1                                          |
| Status         | Active                                       |
| Author         | QA Team                                      |
| Date           | 2026-03-04                                   |
| Related Docs   | BRD-001 v1.1 · SAD-001 v1.1 · TDD-001 v1.1  |
| Reviewers      | QA Lead, Tech Lead, Product Owner            |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Quality Philosophy](#2-quality-philosophy)
3. [Risk Assessment](#3-risk-assessment)
4. [Test Pyramid](#4-test-pyramid)
5. [Unit Testing — Jest & React Testing Library](#5-unit-testing--jest--react-testing-library)
6. [Integration Testing](#6-integration-testing)
7. [End-to-End Testing — Playwright](#7-end-to-end-testing--playwright)
8. [Performance Testing](#8-performance-testing)
9. [Accessibility Testing](#9-accessibility-testing)
10. [Security Testing](#10-security-testing)
11. [Coverage Targets](#11-coverage-targets)
12. [Test Data Strategy](#12-test-data-strategy)
13. [Test Environments](#13-test-environments)
14. [Defect Management](#14-defect-management)
15. [CI/CD Quality Gates](#15-cicd-quality-gates)
16. [Test Reporting & Metrics](#16-test-reporting--metrics)

---

## 1. Introduction

### 1.1 Purpose

This document defines the end-to-end quality assurance strategy for *MyWork*. It establishes what is tested, at which layer, using which tools, and the criteria that must be met before any code reaches production.

This document operates at a higher level than TDD-001 §9 (which covers implementation mechanics). Where TDD-001 shows *how* to write a test, this document defines *what* must be tested, *why* that level is chosen, and *what constitutes sufficient quality* at each gate.

### 1.2 Scope

| In scope                                           | Out of scope                                  |
|----------------------------------------------------|-----------------------------------------------|
| All five domain modules (Tasks, Work Logs, Achievements, Notes, To-Do) | Native mobile apps (not in v1) |
| Authentication and authorisation flows              | Third-party service internals (Resend, Vercel)|
| Global search                                      | Penetration testing (commissioned separately) |
| Admin panel (user & group management)              | Load testing beyond 500 concurrent users (v1 ceiling per BRD NFR-P4) |
| Core Web Vitals and page performance               |                                               |
| WCAG 2.1 AA accessibility                          |                                               |
| OWASP Top 10 automated scan                        |                                               |

### 1.3 Relationship to BRD Non-Functional Requirements

| NFR ID  | Requirement                       | Test Type(s) that validate it               |
|---------|-----------------------------------|---------------------------------------------|
| NFR-P1  | LCP < 2.5s                        | Performance — Lighthouse CI                 |
| NFR-P2  | Search < 500ms                    | Integration — search latency test           |
| NFR-P3  | API P95 < 300ms                   | Performance — k6 load test                  |
| NFR-P4  | 500 concurrent users              | Performance — k6 load test                  |
| NFR-S3  | Input validation / XSS / SQL inj. | Unit (Zod) + Security (OWASP ZAP)           |
| NFR-S4  | OWASP Top 10                      | Security — ZAP baseline scan + manual       |
| NFR-U3  | WCAG 2.1 AA                       | Accessibility — axe-core + manual           |
| NFR-U4  | Browser compatibility             | E2E — Playwright multi-browser matrix       |
| NFR-M1  | ≥ 80% test coverage               | Unit + Integration coverage report          |

---

## 2. Quality Philosophy

### 2.1 Core Principles

| Principle                     | What it means in practice                                                          |
|-------------------------------|------------------------------------------------------------------------------------|
| **Shift-left testing**        | Tests are written alongside code (TDD where appropriate), not after.              |
| **Risk-proportionate effort** | Higher-risk modules and paths get more test depth (see §3).                       |
| **Test what can break**       | Focus on business rules, edge cases, and security boundaries — not framework code. |
| **Deterministic tests only**  | Flaky tests are treated as bugs. They are quarantined and fixed before next merge. |
| **Fast feedback loops**       | Unit tests run in < 60s. CI gate must complete within 15 minutes.                 |
| **No test data leakage**      | Each test owns its data and cleans up; tests never depend on each other's state.   |

### 2.2 Definition of Done (Testing)

A feature is not done until:

- [ ] Unit tests written for all service functions and Zod schemas touched.
- [ ] Integration tests cover each new Route Handler endpoint (happy path + at least 2 error paths).
- [ ] E2E scenario added or updated for any new critical user journey.
- [ ] Coverage thresholds (§11) remain passing after the change.
- [ ] No new accessibility violations introduced (axe check on changed pages).
- [ ] Performance budget not regressed (Lighthouse CI delta ≤ ±10%).
- [ ] Security — no new `npm audit` high/critical issues.
- [ ] All CI quality gates pass (§15).

---

## 3. Risk Assessment

Risk determines where testing effort is concentrated. Higher risk → deeper test coverage + manual exploratory testing.

### 3.1 Module Risk Matrix

| Module                | Business Risk | Data Sensitivity | Complexity | Test Priority |
|-----------------------|---------------|------------------|------------|---------------|
| Authentication        | Critical      | High (credentials, sessions) | High | P0 |
| RBAC / Authorisation  | Critical      | High (data isolation) | High | P0 |
| Tasks (CRUD + soft delete) | High   | Medium           | Medium     | P1 |
| Global Search         | High          | Medium (cross-module data) | High | P1 |
| Work Logs             | High          | Medium           | Medium     | P1 |
| Achievements + Export | High          | Medium (review data) | Medium  | P1 |
| To-Do (carry-over, optimistic) | Medium | Low         | Medium     | P2 |
| Notes (rich text, auto-save) | Medium | Low           | High (Tiptap) | P2 |
| Admin — User Mgmt     | High          | High (account control) | Medium | P1 |
| Admin — Group Mgmt    | Medium        | Medium           | Medium     | P2 |
| Email flows (invite, reset) | Medium | Low            | Low        | P2 |

### 3.2 High-Risk Scenarios Requiring Mandatory Test Coverage

| ID    | Scenario                                                              |
|-------|-----------------------------------------------------------------------|
| RS-01 | Member cannot read another member's tasks, notes, or achievements.   |
| RS-02 | Manager can read (not write) group members' tasks and achievements.  |
| RS-03 | Admin can access all data via the admin panel.                       |
| RS-04 | Deactivated user sessions are immediately revoked.                   |
| RS-05 | Soft-deleted records do not appear in any list or search result.     |
| RS-06 | Password reset token expires after 1 hour and cannot be reused.     |
| RS-07 | Login lockout triggers after 5 consecutive failures.                 |
| RS-08 | Search returns only the authenticated user's own data.               |
| RS-09 | Hard delete of a task cascades to all related work logs and note links.|
| RS-10 | Achievement export respects active filter scope — no data leakage.   |

---

## 4. Test Pyramid

```
                    ▲
                   /|\
                  / | \
                 /  |  \        E2E (Playwright)
                / E2E\  \       ~30–50 scenarios
               /───────\  \     Critical user journeys only
              /         \  \    Slowest — run on PR + nightly
             /───────────\
            /             \     Performance Tests (Lighthouse CI + k6)
           /  Integration   \   ~60–80 tests
          /     (Jest)       \  Route Handlers, DB queries, auth flows
         /───────────────────\  Run on every PR
        /                     \
       /       Unit Tests       \  ~400–600 tests
      /     (Jest + RTL)         \  Services, schemas, components, hooks
     /─────────────────────────── \  Run on every push (< 60s)
    /                               \
   /____ Static Analysis + Type Check _\
        TypeScript · ESLint · Prettier
        Run on every push (< 30s)
```

### 4.1 Layer Allocation Guidelines

| Layer             | % of test suite | Run frequency           | Acceptable duration  |
|-------------------|-----------------|-------------------------|----------------------|
| Static analysis   | —               | Every commit/push       | < 30s                |
| Unit              | ~70%            | Every push              | < 60s                |
| Integration       | ~20%            | Every PR                | < 5 min              |
| E2E               | ~8%             | Every PR + nightly      | < 10 min             |
| Performance       | ~2%             | Every PR + nightly      | < 5 min              |
| Accessibility     | Embedded in E2E | Every PR                | Included in E2E time |
| Security scan     | —               | Every PR                | < 2 min              |

---

## 5. Unit Testing — Jest & React Testing Library

> Implementation setup is defined in TDD-001 §9.2. This section defines scope, prioritisation, and patterns.

### 5.1 What Gets Unit Tested

| Target                        | Why                                               | Coverage Target |
|-------------------------------|---------------------------------------------------|-----------------|
| `lib/services/*.ts`           | Core business logic; no framework overhead.       | 90%             |
| `lib/schemas/*.schema.ts`     | Validates all system inputs; high failure surface. | 95%             |
| `lib/actions/*.ts`            | Zod + auth + service orchestration.               | 85%             |
| `lib/auth/rbac.ts`            | Security-critical — must be exhaustive.           | 100%            |
| `lib/auth/passwords.ts`       | Hashing and verification correctness.             | 100%            |
| `lib/errors.ts`               | Error hierarchy and `handleRouteError`.           | 95%             |
| `lib/utils/*.ts`              | Pure utility functions.                           | 80%             |
| `components/ui/*.tsx`         | Primitive rendering, ARIA attributes, variants.   | 80%             |
| Domain `_components/*.tsx`    | Render with props, user interactions.             | 75%             |

### 5.2 What is NOT Unit Tested

| Skipped                          | Reason                                                              |
|----------------------------------|---------------------------------------------------------------------|
| `next.config.ts`                 | Framework configuration — tested by build success.                 |
| `prisma/schema.prisma`           | Tested by migration success and integration tests.                 |
| `app/**/page.tsx` RSC pages      | These are thin shells; covered by integration + E2E.              |
| `app/**/layout.tsx`              | Structural; covered by E2E visual snapshots.                       |
| Email templates                  | Covered by integration test that asserts email was dispatched.     |

### 5.3 Service Layer Test Patterns

Every service function must cover:

```
createX:
  ✅ Creates with minimum required fields
  ✅ Creates with all optional fields
  ✅ Returns the created entity with expected shape
  ❌ Throws ValidationError if required field is missing (tested at schema level)

getXById:
  ✅ Returns entity when found for correct owner
  ✅ Throws NotFoundError when ID does not exist
  ✅ Throws NotFoundError when entity belongs to different user (ownership isolation)

listX:
  ✅ Returns empty array when no records exist
  ✅ Returns correctly filtered results
  ✅ Cursor pagination — nextCursor is null on last page
  ✅ Soft-deleted records are excluded from results

updateX:
  ✅ Updates only the supplied fields (partial update)
  ✅ Updates updatedAt timestamp
  ✅ Throws NotFoundError if record doesn't exist
  ✅ Throws ForbiddenError if user is not the owner

deleteX / archiveX:
  ✅ Sets deletedAt (soft delete) — record is excluded from subsequent queries
  ✅ Only owner or Admin can soft-delete
```

### 5.4 Zod Schema Test Patterns

Every schema must cover:

```
✅ Valid minimum input (only required fields)
✅ Valid full input (all optional fields populated)
✅ Missing required field → fieldErrors present
✅ Field exceeding max length → fieldErrors present
✅ Invalid enum value → fieldErrors present
✅ Default values applied correctly when field omitted
✅ Type coercion (e.g., string → number for query params)
```

Example test structure:

```typescript
// lib/schemas/achievement.schema.test.ts
import { createAchievementSchema } from './achievement.schema';

describe('createAchievementSchema', () => {
  describe('valid inputs', () => {
    it('accepts minimum required fields', () => { ... });
    it('accepts all optional fields', () => { ... });
    it('defaults impactRating to null when omitted', () => { ... });
  });

  describe('invalid inputs', () => {
    it.each([
      ['empty title', { title: '' }, 'title'],
      ['title over 200 chars', { title: 'x'.repeat(201) }, 'title'],
      ['description over 3000 chars', { title: 'T', description: 'x'.repeat(3001) }, 'description'],
      ['invalid impactRating (0)', { title: 'T', impactRating: 0 }, 'impactRating'],
      ['invalid impactRating (6)', { title: 'T', impactRating: 6 }, 'impactRating'],
    ])('rejects %s', (_label, input, expectedField) => {
      const result = createAchievementSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors[expectedField]).toBeDefined();
    });
  });
});
```

### 5.5 RBAC Unit Tests

`lib/auth/rbac.ts` must achieve **100% branch coverage**:

```typescript
// lib/auth/rbac.test.ts
describe('requireRole', () => {
  it('redirects to /login when no session exists', async () => { ... });
  it('throws ForbiddenError when user role is below minimum', async () => { ... });
  it('throws ForbiddenError when MEMBER accesses another user\'s resource', async () => { ... });
  it('allows MANAGER to access their own resources', async () => { ... });
  it('allows MANAGER to pass resourceOwnerId check (no ownership restriction)', async () => { ... });
  it('allows ADMIN to access any resource regardless of ownerId', async () => { ... });
  it('allows ADMIN to pass with any minRole', async () => { ... });
});
```

### 5.6 Component Testing with RTL

Priorities for component tests:

| Component concern                 | Test approach                                                     |
|-----------------------------------|-------------------------------------------------------------------|
| Renders content from props        | Assert visible text, ARIA labels, data-testid elements.           |
| Conditional rendering             | Test both branches (e.g., empty state vs populated list).         |
| User interactions                 | `userEvent.click`, `userEvent.type`, `userEvent.selectOptions`.   |
| Form submission                   | Mock Server Action; assert it was called with correct args.       |
| Loading/pending states            | `useTransition` pending — button disabled, aria-busy set.         |
| Error states                      | Pass error prop; assert error message is rendered.                |
| Optimistic updates                | Assert UI changes before Server Action resolves.                  |
| Accessibility attributes          | Assert `role`, `aria-label`, `aria-live`, `aria-describedby`.     |

### 5.7 Snapshot Testing Policy

**Snapshots are not used** for component tests. They produce false confidence, break on trivial styling changes, and are routinely committed without review. RTL's intent-based queries (`getByRole`, `getByLabelText`) better document expected behaviour.

---

## 6. Integration Testing

### 6.1 Scope

Integration tests verify that the Route Handler layer (HTTP), service layer (business logic), and database (real PostgreSQL) work correctly together. They use a **dedicated test database** — not mocks.

| Integration test target          | What is asserted                                                  |
|----------------------------------|-------------------------------------------------------------------|
| `GET /api/tasks`                 | Auth guard, filter params, pagination, ownership scoping.         |
| `POST /api/tasks`                | Validation rejection (422), creation (201), DB record created.    |
| `PATCH /api/tasks/:id`           | Partial update, 403 for non-owner, 404 for missing.               |
| `DELETE /api/tasks/:id`          | Admin-only hard delete; 403 for MEMBER; cascades verified.        |
| `GET /api/search`                | Returns results across all modules; respects user scope.          |
| `GET /api/achievements/:id/export` | PDF/Markdown generated; filter scope respected.                |
| `setUserActiveAction`            | Activate/deactivate user; cannot target self; ADMIN-only. Activation sends approval email (email failure non-fatal). |
| `rejectUserAction`               | Reject a pending user; cannot target self; ADMIN-only. Sets `rejectedAt`; sends rejection email (non-fatal). |
| `deleteUserAction`               | Permanently delete a user; cannot delete self; ADMIN-only.              |
| `setUserRoleAction`              | Change user role; cannot target self; ADMIN-only Server Action.         |
| `lib/email/notifications.ts`    | Each notification function sends correct `to`, `subject`, `from`. Email errors are caught silently (non-propagating). |
| Auth flows                       | Login success/failure (credentials + OAuth), inactive user blocked, session expiry. |

### 6.2 Test Database Setup

```
Test DB lifecycle:
  beforeAll → prisma migrate deploy → seed baseline data
  beforeEach → begin transaction (where possible) OR insert test-specific records
  afterEach → rollback transaction OR delete test-specific records
  afterAll → prisma $disconnect
```

Use a separate `DATABASE_URL` pointing to `mywork_test` database in CI (see TDD-001 §12.4 GitHub Actions config).

```typescript
// tests/helpers/db.ts
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/passwords';

export async function createTestUser(overrides: Partial<UserCreateInput> = {}): Promise<TestUser> {
  const password = overrides.password ?? 'test-password-123';
  const hash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}-${Math.random()}@mywork.test`,
      name: 'Test User',
      passwordHash: hash,
      role: 'MEMBER',
      ...overrides,
    },
  });

  return { ...user, plainPassword: password };
}

export async function cleanupTestUser(userId: string): Promise<void> {
  // Cascade: delete all user-owned records, then user
  await prisma.$transaction([
    prisma.todoItem.deleteMany({ where: { userId } }),
    prisma.note.deleteMany({ where: { userId } }),
    prisma.workLog.deleteMany({ where: { userId } }),
    prisma.achievement.deleteMany({ where: { userId } }),
    prisma.task.deleteMany({ where: { ownerId: userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

export async function createTestTask(userId: string, overrides = {}): Promise<Task> {
  return prisma.task.create({
    data: {
      title: `Test Task ${Date.now()}`,
      ownerId: userId,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      tags: [],
      ...overrides,
    },
  });
}
```

### 6.3 Route Handler Test Structure

```typescript
// app/api/tasks/route.test.ts

describe('GET /api/tasks', () => {
  let memberUser: TestUser;
  let adminUser: TestUser;
  let memberTask: Task;

  beforeAll(async () => {
    memberUser = await createTestUser({ role: 'MEMBER' });
    adminUser = await createTestUser({ role: 'ADMIN' });
    memberTask = await createTestTask(memberUser.id, { title: 'Member Task' });
  });

  afterAll(async () => {
    await cleanupTestUser(memberUser.id);
    await cleanupTestUser(adminUser.id);
  });

  describe('authentication', () => {
    it('returns 401 with no session', async () => {
      const res = await GET(makeRequest('/api/tasks'));
      expect(res.status).toBe(401);
    });
  });

  describe('authorisation', () => {
    it('returns only the authenticated member\'s tasks', async () => {
      const res = await GET(makeAuthenticatedRequest(memberUser));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(memberTask.id);
    });

    it('does not return another member\'s tasks', async () => {
      const otherUser = await createTestUser();
      const res = await GET(makeAuthenticatedRequest(otherUser));
      const body = await res.json();
      expect(body.data).toHaveLength(0); // otherUser has no tasks
      await cleanupTestUser(otherUser.id);
    });
  });

  describe('filtering', () => {
    it('filters by status query param', async () => {
      await createTestTask(memberUser.id, { title: 'In Progress Task', status: 'IN_PROGRESS' });
      const res = await GET(makeAuthenticatedRequest(memberUser, '?status=IN_PROGRESS'));
      const body = await res.json();
      expect(body.data.every((t: Task) => t.status === 'IN_PROGRESS')).toBe(true);
    });
  });

  describe('pagination', () => {
    it('returns nextCursor when more results exist', async () => {
      // Create 26 tasks (default limit is 25)
      const res = await GET(makeAuthenticatedRequest(memberUser, '?limit=25'));
      const body = await res.json();
      expect(body.meta.nextCursor).not.toBeNull();
    });
  });
});
```

### 6.4 High-Risk Integration Scenarios (Mandatory)

These map directly to the risk scenarios in §3.2:

| Test ID | Scenario | Layer |
|---------|----------|-------|
| IT-RS-01 | MEMBER `GET /api/tasks` returns 0 results for another user's tasks | Integration |
| IT-RS-02 | MANAGER `GET /api/tasks?userId=X` returns group member's tasks (read) but `POST` returns 403 | Integration |
| IT-RS-03 | ADMIN can `GET /api/admin/users` — MEMBER and MANAGER get 403 | Integration |
| IT-RS-04 | After `PATCH /api/admin/users/:id` deactivation, existing session returns 401 | Integration |
| IT-RS-05 | Soft-deleted task absent from `GET /api/tasks` and `GET /api/search` | Integration |
| IT-RS-06 | Password reset token: second use of same token returns 400 | Integration |
| IT-RS-07 | 6th consecutive login failure returns 429 (rate limited) | Integration |
| IT-RS-08 | `GET /api/search?q=term` never includes another user's data | Integration |

---

## 7. End-to-End Testing — Playwright

### 7.1 Scope and Philosophy

E2E tests exercise the full stack through a real browser. They are **expensive to run and maintain** — add them only for:

- Critical user journeys that cannot be broken without high business impact.
- Flows that span multiple pages or modules.
- Flows that require real browser behaviour (drag-and-drop, keyboard navigation, file download).

**E2E tests do NOT replace unit or integration tests.** A bug in a utility function is caught by a unit test, not by an E2E that happens to exercise it.

### 7.2 Critical User Journeys (CUJs)

| CUJ ID | Journey | Priority |
|--------|---------|----------|
| CUJ-01 | Sign in → view dashboard → sign out | P0 |
| CUJ-02 | Create task → view task detail → edit status → archive | P0 |
| CUJ-03 | Log work against a task → view work log history | P0 |
| CUJ-04 | Add to-do item → complete it → verify progress counter updates | P0 |
| CUJ-05 | Open app next day → see carry-over prompt → carry over 1 item → dismiss 1 | P0 |
| CUJ-06 | Create achievement → export as PDF (download triggered) | P1 |
| CUJ-07 | Create note with rich text → navigate away → return → content preserved | P1 |
| CUJ-08 | Cmd+K → search for term → navigate to result | P1 |
| CUJ-09 | User registers → sees "pending approval" message → Admin activates in /admin/users → user logs in | P1 |
| CUJ-09a | User registers → Admin rejects in /admin/users → user sees Rejected status → Admin can re-approve | P1 |
| CUJ-10 | Admin creates group → assigns manager → manager sees group member tasks | P1 |
| CUJ-11 | Convert to-do item to full Task via one-click action | P2 |
| CUJ-12 | Filter tasks by status + priority → URL reflects filters → reload preserves filters | P2 |

### 7.3 Browser Matrix

| Browser         | Engine   | Run in CI | Notes                               |
|-----------------|----------|-----------|-------------------------------------|
| Chromium        | Blink    | Always    | Primary development browser.        |
| Firefox         | Gecko    | On PR     | Second most used by target audience.|
| WebKit (Safari) | WebKit   | Nightly   | Required for iOS-equivalent testing.|

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,   // Retry flakes in CI only
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['github'],         // Annotates PR with failing test locations
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    // Responsive testing
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'tablet',        use: { ...devices['iPad Pro'] } },
  ],
});
```

### 7.4 Page Object Model (POM) Pattern

All E2E specs use POMs to centralise selectors and actions:

```typescript
// e2e/pages/TasksPage.ts
import type { Page, Locator } from '@playwright/test';

export class TasksPage {
  readonly url = '/tasks';
  readonly newTaskButton: Locator;
  readonly taskList: Locator;
  readonly statusFilter: Locator;

  constructor(private page: Page) {
    this.newTaskButton = page.getByRole('button', { name: 'New Task' });
    this.taskList = page.getByRole('list', { name: 'Tasks' });
    this.statusFilter = page.getByLabel('Status');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  async createTask(title: string, priority: string = 'MEDIUM'): Promise<void> {
    await this.newTaskButton.click();
    await this.page.getByLabel('Title').fill(title);
    await this.page.getByLabel('Priority').selectOption(priority);
    await this.page.getByRole('button', { name: 'Create Task' }).click();
    // Wait for success toast
    await this.page.getByText('Task created').waitFor();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.page.waitForURL(/status=/);
  }

  getTaskCard(title: string): Locator {
    return this.taskList.getByRole('article', { name: `Task: ${title}` });
  }
}
```

### 7.5 E2E Test Data Management

- Each test suite uses **isolated test users** seeded directly via Prisma in `globalSetup` (see `e2e/global-setup.ts`).
- All created users and their data are deleted in `globalTeardown`.
- Tests never share users or tasks across `describe` blocks.
- Test users are created with `isActive: true` directly in the DB to bypass the admin-activation flow.

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { createApiUser, deleteApiUser } from '../helpers/api';

interface AuthFixtures {
  memberPage: Page;
  managerPage: Page;
  adminPage: Page;
}

export const test = base.extend<AuthFixtures>({
  memberPage: async ({ browser }, use) => {
    const user = await createApiUser({ role: 'MEMBER' });
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, user);
    await use(page);
    await context.close();
    await deleteApiUser(user.id);
  },
  // managerPage, adminPage follow same pattern
});
```

### 7.6 Flakiness Prevention

| Practice                            | Implementation                                             |
|-------------------------------------|------------------------------------------------------------|
| Wait for network idle after actions | `await page.waitForLoadState('networkidle')` where needed. |
| Assert visible before interacting   | Always `await expect(locator).toBeVisible()` before `.click()`. |
| Avoid fixed `waitForTimeout`        | Use `waitFor`, `waitForResponse`, or `waitForURL` instead. |
| Retry on flake in CI only           | `retries: 2` in CI; `retries: 0` locally.                 |
| Trace on first retry                | Full trace available for every CI flake investigation.     |
| Dedicated test database             | No shared state with manual testing or other environments. |

---

## 8. Performance Testing

### 8.1 Core Web Vitals — Lighthouse CI

Lighthouse CI runs on every PR against the Vercel preview deployment and enforces performance budgets tied to BRD NFR-P1.

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        '/dashboard',
        '/tasks',
        '/todos',
        '/search?q=test',
        '/achievements',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance':    ['error', { minScore: 0.85 }],
        'categories:accessibility':  ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'first-contentful-paint':    ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint':  ['error', { maxNumericValue: 2500 }], // BRD NFR-P1
        'total-blocking-time':       ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift':   ['error', { maxNumericValue: 0.1 }],
        'interactive':               ['error', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 8.2 API Load Testing — k6

k6 tests run on staging before every release to validate NFR-P3 (API P95 < 300ms) and NFR-P4 (500 concurrent users).

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const apiLatency = new Trend('api_latency');
const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    // Ramp up to 500 concurrent users — BRD NFR-P4
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up
        { duration: '5m', target: 500 },   // Sustain peak — BRD NFR-P4
        { duration: '2m', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    api_latency:               ['p(95)<300'],  // BRD NFR-P3: P95 < 300ms
    error_rate:                ['rate<0.01'],  // < 1% error rate
    'http_req_duration{name:list_tasks}': ['p(95)<300'],
    'http_req_duration{name:search}':     ['p(95)<500'], // BRD NFR-P2
  },
};

const BASE_URL = __ENV.BASE_URL;
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN; // Pre-generated service account JWT

export default function () {
  const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };

  // Tasks list
  const tasksRes = http.get(`${BASE_URL}/api/tasks`, { headers, tags: { name: 'list_tasks' } });
  apiLatency.add(tasksRes.timings.duration);
  check(tasksRes, { 'tasks 200': (r) => r.status === 200 });
  errorRate.add(tasksRes.status >= 400);

  sleep(1);

  // Search
  const searchRes = http.get(`${BASE_URL}/api/search?q=test`, { headers, tags: { name: 'search' } });
  apiLatency.add(searchRes.timings.duration);
  check(searchRes, { 'search 200': (r) => r.status === 200 });

  sleep(1);
}
```

### 8.3 Search Performance Validation

A dedicated integration test validates the 500ms search SLA at scale:

```typescript
// lib/services/search.perf.test.ts
describe('search performance', () => {
  beforeAll(async () => {
    // Seed 10,000 records (BRD NFR-P2 target dataset)
    await seedLargeDataset({ tasksPerUser: 2000, notesPerUser: 3000, ... });
  });

  it('returns results within 500ms for a 10k-record dataset', async () => {
    const start = performance.now();
    await runGlobalSearch(testUserId, 'quarterly review');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500); // BRD NFR-P2
  });
});
```

### 8.4 Database Query Performance

Slow query detection is integrated into the development workflow:

```typescript
// lib/db/prisma.ts — add query timing middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const elapsed = Date.now() - start;

  if (elapsed > 100) {
    logger.warn(
      { model: params.model, action: params.action, durationMs: elapsed },
      'Slow Prisma query detected',
    );
  }

  return result;
});
```

### 8.5 Performance Regression Policy

- Lighthouse CI score must not drop more than **5 points** from the previous PR baseline.
- Any score drop > 5 points blocks merge and requires Tech Lead sign-off.
- k6 P95 latency increase > 50ms above threshold triggers a mandatory investigation before release.

---

## 9. Accessibility Testing

### 9.1 Standard

All pages must comply with **WCAG 2.1 Level AA** (BRD NFR-U3).

### 9.2 Automated Testing — axe-core via Playwright

axe-core runs on every page in the E2E suite:

```typescript
// e2e/specs/a11y/wcag.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES_TO_CHECK = [
  { path: '/dashboard',     name: 'Dashboard' },
  { path: '/tasks',         name: 'Tasks list' },
  { path: '/todos',         name: 'Daily to-do' },
  { path: '/achievements',  name: 'Achievements' },
  { path: '/notes',         name: 'Notes list' },
  { path: '/search?q=test', name: 'Search results' },
];

for (const { path, name } of PAGES_TO_CHECK) {
  test(`${name} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

// Test interactive states that may introduce violations
test('CmdK search dialog has no violations when open', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Meta+k');
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### 9.3 Manual Accessibility Testing Checklist

The following is verified by QA manually on every release candidate:

#### Keyboard Navigation

- [ ] All interactive elements reachable by Tab in logical DOM order.
- [ ] Focus ring visible on all focusable elements (not suppressed globally).
- [ ] Dialogs (create task, carry-over prompt) trap focus correctly.
- [ ] Pressing Escape closes dialogs and returns focus to the trigger element.
- [ ] Cmd+K opens search; Escape closes it; focus returns to where it was.
- [ ] To-do drag-and-drop has a keyboard reorder alternative (move up/down with arrow keys).
- [ ] Date picker in to-do / filter is keyboard operable.

#### Screen Reader Testing

| Browser + Screen Reader           | Platform  | Tester Focus Areas                     |
|-----------------------------------|-----------|----------------------------------------|
| VoiceOver + Safari                | macOS     | Task list, form fields, live regions.  |
| NVDA + Firefox                    | Windows   | Status badges, search results grouped. |
| TalkBack + Chrome (via emulator)  | Android   | Touch targets, mobile navigation.      |

Key assertions:
- Task status badges announce their label (not just colour).
- Toast notifications are announced via `aria-live="polite"`.
- Progress indicator on to-do page ("3 of 7 complete") is announced on change.
- Rich text editor (Tiptap) toolbar buttons have descriptive `aria-label`.
- Search results grouped by module are announced as groups.
- Form validation errors are associated with their input via `aria-describedby`.

#### Colour & Contrast

- [ ] All body text meets 4.5:1 contrast ratio against background.
- [ ] Large text (≥ 18pt / ≥ 14pt bold) meets 3:1 contrast ratio.
- [ ] Status badge colours (In Progress = blue, Blocked = red, etc.) have a non-colour indicator (icon or text label).
- [ ] Priority indicators not conveyed by colour alone.

#### Zoom & Reflow

- [ ] App is usable at 200% browser zoom with no horizontal scrolling on 1280px viewport.
- [ ] At 400% zoom (WCAG 1.4.10 Reflow), content reflows to single column without loss of functionality.

### 9.4 Accessibility Defect Classification

| Severity  | WCAG Failure          | Resolution SLA          |
|-----------|-----------------------|-------------------------|
| Critical  | Level A violation     | Block release; fix before deploy |
| High      | Level AA violation    | Fix within 2 sprints    |
| Medium    | Level AA advisory     | Fix within 4 sprints    |
| Low       | Best practice / AAA   | Backlog; address when convenient |

---

## 10. Security Testing

### 10.1 Dependency Vulnerability Scanning

Runs on every PR and nightly:

```yaml
# .github/workflows/ci.yml (security job)
- name: Audit dependencies
  run: npm audit --audit-level=high
  # Fails CI if any high or critical CVEs found in production dependencies
```

Policy:
- **Critical / High CVEs in production dependencies** → block merge immediately.
- **Moderate CVEs** → create a ticket; fix within 2 sprints.
- **Dev-only CVEs** → create a ticket; fix within next dependency maintenance window.

### 10.2 OWASP ZAP Baseline Scan

ZAP passive scan runs against the staging environment on every release candidate:

```yaml
# .github/workflows/zap.yml
- name: OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: ${{ secrets.STAGING_URL }}
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-I'  # Continue on warnings (fail on errors only)
```

ZAP checks against:
- Injection (SQL, command, LDAP) — prevented by Prisma parameterised queries.
- XSS — prevented by React escaping + DOMPurify + CSP.
- Security headers — HSTS, CSP, X-Frame-Options, Referrer-Policy.
- Sensitive data exposure in responses.
- Insecure cookies (httpOnly, Secure, SameSite).
- CSRF — prevented by NextAuth CSRF + SameSite cookies.

### 10.3 Manual Security Test Cases

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SEC-01 | Modify JWT cookie manually and make API request | 401 Unauthorized |
| SEC-02 | Submit task title with `<script>alert(1)</script>` | Script not executed; stored as plain text |
| SEC-03 | Access `/api/admin/users` with MEMBER session | 403 Forbidden |
| SEC-04 | Access another user's task by ID via `GET /api/tasks/:id` | 404 Not Found (not 403, to prevent enumeration) |
| SEC-05 | Submit a work log with `taskId` belonging to another user | 403 or 404 |
| SEC-06 | Use expired password reset link | 400 Invalid or expired token |
| SEC-07 | Replay a used password reset link | 400 Token already used |
| SEC-08 | Request `GET /api/search?q=` with 1000-char query | 422 Validation error (Zod limits query length) |
| SEC-09 | Send `Content-Type: text/html` instead of `application/json` to a POST endpoint | 422 Validation error |
| SEC-10 | Attempt to access admin routes with MANAGER role | 403 Forbidden |

### 10.4 Auth-Specific Security Tests

These are covered as integration tests (§6.4) and confirmed manually:

| Scenario                              | Validation                                                   |
|---------------------------------------|--------------------------------------------------------------|
| Login rate limiting                   | 6th failure within 15 minutes → 429 response.               |
| Session invalidation on deactivation  | Active session cookie rejected after `isActive=false` set.   |
| Password reset token expiry           | Token rejected after 1 hour.                                 |
| Secure cookie flags                   | `Secure`, `HttpOnly`, `SameSite=Strict` verified via devtools.|
| Invitation link expiry                | Link rejected after 72 hours.                                |

---

## 11. Coverage Targets

### 11.1 Global Thresholds (enforced in CI)

```typescript
// jest.config.ts
coverageThreshold: {
  global: {
    branches:   80,
    functions:  80,
    lines:      80,
    statements: 80,
  },
},
```

### 11.2 Per-Layer Targets

| Layer                          | Target  | Rationale                                        |
|--------------------------------|---------|--------------------------------------------------|
| `lib/auth/rbac.ts`             | 100%    | Security-critical; every branch must be verified.|
| `lib/auth/passwords.ts`        | 100%    | Security-critical.                               |
| `lib/services/*.ts`            | 90%     | Core business logic; highest value unit tests.   |
| `lib/schemas/*.schema.ts`      | 95%     | All validation paths must be tested.             |
| `lib/actions/*.ts`             | 85%     | Thin orchestration layer; trust service tests.   |
| `lib/errors.ts`                | 95%     | Error hierarchy used everywhere.                 |
| `lib/utils/*.ts`               | 80%     | Pure utilities; straightforward to test.         |
| `components/ui/*.tsx`          | 80%     | Primitives; variant + accessibility assertions.  |
| `app/**/_components/*.tsx`     | 75%     | Higher-level components; E2E covers the gaps.    |
| `app/api/**/route.ts`          | 70%     | Integration tests cover most paths.              |

### 11.3 Coverage Exclusions

```typescript
// jest.config.ts — excluded from coverage
collectCoverageFrom: [
  'lib/**/*.ts',
  'components/**/*.tsx',
  'app/**/_components/**/*.tsx',
  '!**/*.d.ts',
  '!**/index.ts',                     // Re-export barrels
  '!prisma/seed.ts',                  // Dev tooling
  '!app/**/layout.tsx',               // Structural; covered by E2E
  '!app/**/page.tsx',                 // RSC shells; covered by integration/E2E
  '!app/**/error.tsx',                // Error boundaries; covered by E2E
  '!app/**/loading.tsx',              // Suspense skeletons
],
```

### 11.4 Coverage Ratchet Policy

Coverage thresholds are a **floor, not a target**. When coverage exceeds a threshold consistently, the threshold is raised to prevent regression:

- If global coverage stays ≥ 85% for 2 consecutive sprints, raise the threshold to 85%.
- Thresholds are never lowered except with explicit Tech Lead sign-off documented in a PR.

---

## 12. Test Data Strategy

### 12.1 Principles

| Principle                | Implementation                                                              |
|--------------------------|-----------------------------------------------------------------------------|
| **Isolation**            | Each test creates and destroys its own data.                                |
| **Reproducibility**      | Tests produce the same result on every run without manual DB intervention.  |
| **No shared mutable state** | Tests do not read records created by other tests.                        |
| **Realistic data**       | Factories produce valid data matching BRD field constraints.                |
| **No PII in test data**  | All emails use `@mywork.test` domain; names are randomly generated.        |

### 12.2 Factory Pattern

```typescript
// tests/factories/task.factory.ts
import { faker } from '@faker-js/faker';
import type { TaskStatus, Priority } from '@prisma/client';

interface TaskFactoryOptions {
  ownerId: string;
  status?: TaskStatus;
  priority?: Priority;
  tags?: string[];
  deletedAt?: Date | null;
}

export function buildTask(opts: TaskFactoryOptions) {
  return {
    title: faker.hacker.phrase().slice(0, 200),
    description: faker.lorem.paragraph(),
    status: opts.status ?? 'BACKLOG',
    priority: opts.priority ?? 'MEDIUM',
    dueDate: faker.date.future(),
    tags: opts.tags ?? [faker.hacker.adjective()],
    ownerId: opts.ownerId,
    deletedAt: opts.deletedAt ?? null,
  };
}

// Trait shortcuts
export const buildArchivedTask = (opts: TaskFactoryOptions) =>
  buildTask({ ...opts, deletedAt: new Date() });

export const buildHighPriorityTask = (opts: TaskFactoryOptions) =>
  buildTask({ ...opts, priority: 'HIGH' });
```

### 12.3 Test Database Seeding for Integration Tests

```
Base seed (beforeAll in integration test suite):
  └── 1 Admin user
  └── 1 Manager user
  └── 1 Member user (primary test subject)
  └── 1 Member user (for isolation testing)
  └── 1 Group (Manager → Member)
  └── 3 Tasks for primary Member
  └── 1 Task for isolation Member (must not appear in primary Member's queries)
```

Each test file that needs additional data creates it in `beforeEach` and cleans it in `afterEach`.

### 12.4 E2E Test Data

E2E tests use the **API layer** to set up and tear down data (not direct DB access):

- Create users directly via Prisma in `e2e/global-setup.ts` (with `isActive: true` to bypass admin-activation).
- Create tasks/notes/etc. via their respective API endpoints.
- Delete via `DELETE` endpoints or direct DB helper in `afterAll`.

This ensures the API itself is exercised in setup, catching regressions in data creation paths.

### 12.5 Performance Test Dataset

The k6 and search performance tests require a large dataset. A dedicated seed script generates it:

```typescript
// prisma/seed-perf.ts
async function seedPerformanceData(): Promise<void> {
  const users = await createBulkUsers(50);
  for (const user of users) {
    await createBulkTasks(user.id, 200);       // 10k tasks total
    await createBulkNotes(user.id, 100);        // 5k notes total
    await createBulkWorkLogs(user.id, 100);     // 5k work logs total
    await createBulkAchievements(user.id, 20);  // 1k achievements total
    await createBulkTodos(user.id, 50);         // 2.5k todos total
  }
}
```

---

## 13. Test Environments

### 13.1 Environment Map

| Environment | Purpose                           | DB                    | Test Types Run        |
|-------------|-----------------------------------|-----------------------|-----------------------|
| Local dev   | Developer iteration               | `mywork_dev`          | Unit (watch mode)     |
| CI — PR     | PR quality gate                   | `mywork_test` (fresh) | Unit + Integration + Static + Security |
| CI — Nightly| Regression + performance          | `mywork_test` (fresh) | All including E2E, k6, Lighthouse |
| Staging     | Pre-release validation            | `mywork_staging`      | E2E smoke + ZAP scan  |
| Production  | Live system                       | `mywork_prod`         | Synthetic monitoring only |

### 13.2 Test Database Lifecycle (CI)

```
Job start → prisma migrate deploy (applies all migrations to clean DB)
         → prisma db seed (inserts base seed)
         → Tests run
         → Job end → DB instance destroyed
```

Each CI run starts with a clean, known database state. There is no persistent CI database.

### 13.3 Environment Variables for Testing

```bash
# .env.test (committed — no secrets; overridden per environment in CI secrets)
DATABASE_URL="postgresql://postgres:test@localhost:5432/mywork_test"
NEXTAUTH_SECRET="test-secret-exactly-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_test_fake_key_for_unit_tests"
EMAIL_FROM="test@mywork.test"
LOG_LEVEL="error"   # Suppress logs in test output
```

---

## 14. Defect Management

### 14.1 Severity Classification

| Severity | Definition | Examples | Target Resolution |
|----------|------------|----------|-------------------|
| **P0 — Critical** | System unusable; data loss; security breach; auth bypass | Login broken, data leaking across users, XSS in production | Fix and hotfix within 4 hours |
| **P1 — High** | Core user journey broken; significant data integrity issue | Can't create tasks, search returns no results, achievement export fails | Fix within 1 business day |
| **P2 — Medium** | Feature degraded but workaround exists | Filter not persisting to URL, carry-over prompt not showing | Fix within current sprint |
| **P3 — Low** | Minor UX issue; cosmetic; edge case | Label truncation, tooltip position, minor alignment | Backlog; prioritise in next planning |
| **P4 — Trivial** | Typo, colour variation, cosmetic only | Button label casing, icon size | Fix when convenient |

### 14.2 Defect Triage Process

```
Bug reported → QA Lead triages severity within 2h (working hours)
  → P0: Engineering on-call notified immediately; hotfix branch opened
  → P1: Added to active sprint; engineering lead assigns
  → P2/P3: Ticket created; added to backlog; prioritised at next planning
  → P4: Ticket created; tagged 'cosmetic'
```

### 14.3 Regression Policy

- Every P0 and P1 bug that reaches production gets a **regression test** written as part of the fix PR.
- The regression test must fail on the unfixed code and pass after the fix.
- P2 regression tests are encouraged; P3/P4 are optional.

### 14.4 Zero-Tolerance Items

The following are automatically P0 regardless of apparent impact:

- Any data leaking across user boundaries (RS-01 through RS-10 in §3.2 fail).
- Any auth bypass (unauthenticated access to protected routes).
- Any WCAG Level A accessibility violation in a released page.
- Any production SQL error caused by unvalidated input.

---

## 15. CI/CD Quality Gates

### 15.1 PR Quality Gate (blocks merge to `develop`)

```mermaid
flowchart LR
    PR["PR Opened"] --> S1["Static Analysis\nTypeScript + ESLint + Prettier\n< 30s"]
    PR --> S2["Unit Tests\nJest (all)\nCoverage ≥ 80%\n< 60s"]
    PR --> S3["Security\nnpm audit --audit-level=high\n< 30s"]

    S1 & S2 & S3 --> S4["Build\nnext build\n< 3 min"]

    S4 --> S5["Integration Tests\nJest (Route Handlers + DB)\n< 5 min"]
    S5 --> S6["E2E Tests\nPlaywright (Chromium only on PR)\n< 10 min"]
    S6 --> S7["Lighthouse CI\nCore Web Vitals budget\n< 5 min"]

    S7 --> Gate{"All gates\npassed?"}
    Gate -- Yes --> Merge["Merge allowed"]
    Gate -- No --> Block["Merge blocked\nreport posted to PR"]
```

### 15.2 Nightly Quality Gate (runs on `develop` at 02:00 UTC)

Includes everything in the PR gate, plus:

- Full E2E browser matrix (Chromium + Firefox + WebKit + Mobile Chrome).
- k6 load test against staging (500 VUs for 5 minutes).
- OWASP ZAP baseline scan against staging.
- Search performance test (10k dataset).

### 15.3 Release Gate (before merge `develop` → `main`)

All nightly gate items must have passed within the last 24 hours, plus:

- Manual QA sign-off on all P0/P1 test cases in §10.3.
- Manual accessibility checklist (§9.3) completed on staging.
- Tech Lead review of any database migrations in the release.
- Release Manager confirms no breaking changes or documents migration steps.

### 15.4 Gate Failure Policy

| Gate        | Failure Response                                                         |
|-------------|--------------------------------------------------------------------------|
| Static      | Author fixes before re-requesting review. No exceptions.                 |
| Unit tests  | Author fixes. Coverage drops may not be waived.                          |
| Build       | Author fixes. If caused by infra, flag to platform team.                 |
| Integration | Author investigates. Flaky tests quarantined, not ignored.               |
| E2E         | Two retries in CI. Persistent failures escalated to QA lead.             |
| Lighthouse  | Author investigates performance regression. Waiver requires Tech Lead sign-off. |
| k6          | Release held. Performance investigation opened before rescheduling.      |
| ZAP         | All errors block release. Warnings reviewed and signed off by Tech Lead. |

---

## 16. Test Reporting & Metrics

### 16.1 Per-PR Reporting

Every PR receives automated comments with:
- Jest coverage summary (delta from base branch).
- Lighthouse CI score delta per metric.
- Playwright test summary (pass/fail/flaky per browser).
- Link to full HTML reports (stored as CI artefacts for 30 days).

### 16.2 Quality Metrics Tracked Weekly

| Metric                          | Target                        | Reported in   |
|---------------------------------|-------------------------------|---------------|
| Overall test coverage           | ≥ 80%                         | Codecov       |
| `lib/auth/rbac.ts` coverage     | 100%                          | Codecov       |
| E2E pass rate                   | ≥ 99% (over rolling 7 days)   | Playwright CI |
| E2E flake rate                  | < 1% (per test, per week)     | Custom report |
| Mean time to fix a flaky test   | < 1 sprint                    | Jira / GitHub |
| P0/P1 bugs reaching production  | 0 per quarter                 | Bug tracker   |
| LCP (production, P75)           | < 2.5s                        | Vercel Analytics |
| API P95 latency (staging)       | < 300ms                       | k6 reports    |
| WCAG violations (new per sprint)| 0 Level A; 0 Level AA         | axe CI        |
| npm audit highs/criticals       | 0                             | CI audit job  |

### 16.3 Test Health Dashboard

A test health report is generated after each nightly run and posted to the engineering Slack channel:

```
🟢 MyWork — Nightly Quality Report (2026-02-24)

Unit Tests:       528/528 passed   Coverage: 84.2% (+0.3%)
Integration:       61/61 passed
E2E (Chromium):    47/47 passed
E2E (Firefox):     47/47 passed
E2E (WebKit):      45/47 passed   [2 known flaky — tickets #402, #407]
Lighthouse LCP:    1.9s (budget: 2.5s) ✅
k6 P95 latency:   187ms (budget: 300ms) ✅
Search P95:        243ms (budget: 500ms) ✅
npm audit:         0 high/critical ✅
WCAG violations:   0 ✅

🔴 Action required: 2 E2E flakes on WebKit (tickets linked above)
```

### 16.4 Quarterly QA Review

Each quarter, the QA Lead reviews:

- Coverage trends by module (improving / stagnating / regressing).
- Flaky test list — any test flaky for > 1 sprint is immediately fixed or deleted.
- Defect escape rate (bugs found in production vs found in test).
- Performance trends against NFR targets.
- Accessibility audit results (manual + automated).

Outputs are a short QA Health Report shared with the Product Owner and Tech Lead.

---

---

## 17. Change Log

| Version | Date       | Author   | Summary                                                                                                                 |
|---------|------------|----------|-------------------------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-02-24 | QA Team  | Initial release.                                                                                                        |
| 1.1     | 2026-03-04 | Tech Lead | Added `rejectUserAction`, `deleteUserAction`, `lib/email/notifications.ts` to integration test targets; added CUJ-09a (reject + re-approve flow); updated related doc references to v1.1. |

---

*End of Document — TS-001 v1.1*
