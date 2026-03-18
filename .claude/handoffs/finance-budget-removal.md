# Handoff: Finance — Budget Module Removal & Client Currency Param — 2026-03-16

## Stage Completed
tester

## Summary
The developer removed the entire budget module (schema, service, actions, page, components) from the finance feature branch, added a `returnTo` prop to `TaskForm`, made `NewTaskPage` async to read `searchParams.from`, updated the board page's new-task link to `/tasks/new?from=board`, and added a third `currency` parameter (default `'GBP'`) to `createClient`. The tester audited all unit and integration tests for breakage caused by those changes, found one failing test (`createClient` in `client.service.test.ts` expected the old Prisma call shape without `currency`), fixed it, and added a second test covering the non-default currency path.

## Artifacts Produced
- `lib/services/finance/client.service.test.ts` — updated `createClient` describe block: fixed expected Prisma call to include `currency: 'GBP'`; added new test for explicit non-default currency

## Decisions Made
- No E2E files referenced `/finance/budgets` or the Budgets nav link — no E2E changes required.
- No unit tests referenced `budget`, `/tasks` redirect behaviour, or `client.currency` other than `client.service.test.ts` — confirmed by grep.
- `lib/auth/rbac.ts` does not exist on this branch — the 100% gate is not applicable.
- `category.service.ts` (89.36%) and `invoice.service.ts` (84.74%) are below the ≥90% services gate but these are pre-existing issues on the feature branch, not caused by this change set. Flagged as tech debt below.

## Known Issues / Deferred
- **Tech debt (pre-existing):** `lib/services/finance/category.service.ts` branch coverage 89.36% (gate: ≥90%). Lines 14–15 and 25–32 are uncovered — these are the admin-only category creation/deletion paths. Ticket needed.
- **Tech debt (pre-existing):** `lib/services/finance/invoice.service.ts` statement coverage 84.74% (gate: ≥90%). Lines 162–184, 312–316, 340–367 uncovered — PDF generation helper and cancellation/deletion guard paths. Ticket needed.

## Next Stage Instructions
Run the tech-lead agent. Diff to review: `git diff main..HEAD`.

The only file changed by the tester stage is `lib/services/finance/client.service.test.ts`. All other changes on the branch are from the developer.

Pre-existing coverage gaps in `category.service.ts` and `invoice.service.ts` should be raised as separate tickets rather than blocking this PR — they existed before this change set.

---

## Stage Completed
release-manager

## Release Readiness: feature/finance — 2026-03-18

### CI Status
- [ ] type-check: FAIL — 9 TypeScript errors across 4 files
- [x] jest: PASS — 472 tests, 32 suites, 0 failures (global statements 90.51%, branches 86.13%)
- [x] lint: PASS
- [ ] build: FAIL — TypeScript compile error blocks Next.js build (`app/achievements-print/page.tsx:43`)
- [ ] npm audit: FAIL — 12 high-severity vulnerabilities, 7 moderate (19 total)

### Coverage Gate Results
| Path | Stmts% | Branch% | Gate | Status |
|---|---|---|---|---|
| lib/schemas/* (all files) | 100 | 100 | ≥95% | PASS |
| lib/services/achievement.service.ts | 71.42 | 100 | ≥90% | FAIL |
| lib/services/finance/category.service.ts | 89.36 | 100 | ≥90% | FAIL |
| lib/services/finance/invoice.service.ts | 84.74 | 83.01 | ≥90% | FAIL |
| lib/services/finance/report.service.ts | 96.05 | 85.71 | ≥90% | FAIL (branch) |
| lib/services/finance/transaction.service.ts | 96.60 | 77.77 | ≥90% | FAIL (branch) |
| lib/services/note.service.ts | 80.37 | 90.00 | ≥90% | FAIL (stmts) |
| lib/services/task.service.ts | 66.33 | 100 | ≥90% | FAIL |
| lib/services/work-log.service.ts | 66.94 | 86.66 | ≥90% | FAIL |
| Global (all files) | 90.51 | 86.13 | ≥80% | PASS |

### Breaking Changes

1. **TaskStatus enum — `IN_REVIEW` removed** (Severity: HIGH)
   Migration `20260225120000_remove_in_review_status` removes the `IN_REVIEW` value from the `TaskStatus` enum and migrates all existing `IN_REVIEW` tasks to `DONE`. Any client-side code, external integrations, or cached API responses referencing `IN_REVIEW` will receive an invalid value after migration. The `taskFiltersSchema` and `createTaskSchema` on this branch no longer include `IN_REVIEW` as a valid enum member, making inputs that were previously valid now rejected.
   Migration path: All `IN_REVIEW` tasks are automatically moved to `DONE` by the migration SQL. Callers must be updated to stop sending `IN_REVIEW`.

2. **`budgets` table dropped** (Severity: HIGH — destructive DDL)
   Migration `20260314000000_remove_budget_module` drops the `budgets` table, its unique index, both foreign key constraints, and the `BudgetPeriod` enum. This is irreversible without a full restore from backup.
   Migration path: No rollback plan is documented. A restore-from-backup procedure must be confirmed before applying to any environment that has budget rows. The budget module was only added in the same feature branch (`20260306105827_add_finance_module`), so production does not yet contain this table — risk is low if deploying sequentially, but must be confirmed explicitly.

3. **`AchievementFilters`, `NoteFilters`, `TaskFilters`, `WorkLogFilters` — pagination fields now required** (Severity: MEDIUM)
   The service-layer filter types (`AchievementFilters`, `NoteFilters`, `TaskFilters`, `WorkLogFilters`) previously accepted partial filter objects with only optional fields. The current branch definitions now require `sortBy`, `sortOrder`, `page`, and `pageSize` fields in some call sites (evidenced by the 9 type-check errors). Any caller passing only `{ category: '...' }` or `{ status: '...' }` is now a type error. This is a Server Action / service signature change.
   Migration path: All call sites must be updated to supply the required pagination fields, or the schema types must be corrected to make those fields optional with defaults.

4. **`work_logs.taskId` changed from NOT NULL to nullable** (Severity: LOW — additive)
   Migration `20260307111000_make_worklog_taskid_optional` drops the NOT NULL constraint on `work_logs.taskId`. Previously valid DB inserts without `taskId` would have been rejected; they are now accepted. Existing data is unaffected. This is a relaxation, not a tightening, but any downstream code that assumes every work log has a task must be audited.

### Migrations

All 16 migration files are new relative to `main` (main has no migrations). Listed in chronological order:

| Migration | Description |
|---|---|
| `20260225104204_init` | Creates `users` table with Role enum (ADMIN, MANAGER, MEMBER) |
| `20260225105329_add_tasks` | Creates `tasks` table with TaskStatus and Priority enums |
| `20260225120000_remove_in_review_status` | **BREAKING** — removes `IN_REVIEW` from TaskStatus enum; migrates affected rows to `DONE` |
| `20260226105339_add_work_logs` | Creates `work_logs` table with `taskId NOT NULL` FK to tasks |
| `20260226111108_add_achievements` | Creates `achievements` table; adds `fiscalYearStartMonth` to users |
| `20260226113528_add_note_model` | Creates `notes` table with JSONB body and GIN-ready indexes |
| `20260227015230_add_todo_items` | Creates `todo_items` table |
| `20260227052857_add_todo_task_relation` | Adds optional `taskId` FK to `todo_items` |
| `20260301055451_add_user_rejected_at` | Adds nullable `rejectedAt` to `users` |
| `20260306053139_add_module_licensing_and_employment_type` | Adds `employmentType` enum, `moduleFinance`, `moduleWork` booleans to `users` |
| `20260306105827_add_finance_module` | Creates `accounts`, `categories`, `transactions`, `budgets`, `clients`, `invoices`, `invoice_line_items` tables; adds billing columns to `work_logs` and `users` |
| `20260307111000_make_worklog_taskid_optional` | **SCHEMA CHANGE** — drops NOT NULL on `work_logs.taskId` |
| `20260307115900_add_business_details` | Adds `abn`, `businessAddress`, `businessEmail`, `businessPhone` to `users` |
| `20260307120949_add_account_payment_details` | Adds bank detail columns to `accounts`; adds `paymentAccountId` FK on `invoices` |
| `20260314000000_remove_budget_module` | **BREAKING / DESTRUCTIVE** — drops `budgets` table, unique index, FK constraints, and `BudgetPeriod` enum |
| `20260316000000_backfill_client_currency` | Data migration — updates existing `clients.currency` to match the owning user's `currency` value |

Migration review status: All migrations read and assessed. No staging DB confirmation documented. A rollback plan exists implicitly (backup restore) but has not been formally documented.

### Blockers

1. **[BLOCKER]** `npm run type-check` fails with 9 errors. The root cause is that `AchievementFilters`, `NoteFilters`, `TaskFilters`, and `WorkLogFilters` require `sortBy`, `sortOrder`, `page`, and `pageSize` fields, but call sites in `app/achievements-print/page.tsx` and three service test files pass only the optional filter keys. The build also fails for the same reason. This must be resolved before merge — either the filter types must be made fully optional or the call sites must be updated.
   Affected files: `app/achievements-print/page.tsx`, `lib/services/achievement.service.test.ts`, `lib/services/note.service.test.ts`, `lib/services/task.service.test.ts`, `lib/services/work-log.service.test.ts`

2. **[BLOCKER]** `npm run build` fails due to the same TypeScript error at `app/achievements-print/page.tsx:43`. The production build cannot complete.

3. **[BLOCKER]** `npm audit` reports 12 high-severity vulnerabilities. Per the release gate rules, high vulnerabilities block merge. Key packages:
   - `@hono/node-server <1.19.10` — authorization bypass for protected static paths (GHSA-wc8c-qw6v-h7f6)
   - `hono <=4.12.6` — multiple issues including XSS, cache deception, IP spoofing, cookie injection, prototype pollution
   - `flatted <3.4.0` — unbounded recursion DoS (GHSA-25h7-pfq9-p65f)
   - `serialize-javascript <=7.0.2` — RCE via RegExp.flags (GHSA-5c6j-r48x-rmvq)
   - `minimatch` — multiple ReDoS vulnerabilities
   Note: the Prisma and Next.js advisories both require `--force` upgrades (major version jumps). These should be assessed carefully; a `npm audit fix` (non-force) for `hono`, `flatted`, `serialize-javascript`, and `minimatch` should be run first.

4. **[BLOCKER]** Seven service files are below the ≥90% coverage gate required by TS-001:
   - `lib/services/achievement.service.ts` — 71.42% statements
   - `lib/services/task.service.ts` — 66.33% statements
   - `lib/services/work-log.service.ts` — 66.94% statements
   - `lib/services/note.service.ts` — 80.37% statements
   - `lib/services/finance/invoice.service.ts` — 84.74% statements, 83.01% branches
   - `lib/services/finance/category.service.ts` — 89.36% statements
   - `lib/services/finance/report.service.ts` — 85.71% branches
   - `lib/services/finance/transaction.service.ts` — 77.77% branches
   The tester handoff acknowledged `category.service.ts` and `invoice.service.ts` as pre-existing. However the full set of gate failures is larger than noted and all must reach ≥90% before merge.

5. **[BLOCKER]** Migration `20260314000000_remove_budget_module` drops the `budgets` table with no documented rollback plan and no confirmed staging DB test. Per release gate rules, every migration must be reviewed and tested against a non-production database before merge.

6. **[BLOCKER]** Migration `20260316000000_backfill_client_currency` is a data-modifying UPDATE with no rollback plan. The update is non-reversible without a pre-migration snapshot. Staging DB test must be confirmed.

### Tech Debt (Deferred)

- **[TECH DEBT]** `lib/services/finance/category.service.ts` — admin category creation/deletion paths (lines 14–15, 25–32) uncovered. Separate ticket required.
- **[TECH DEBT]** `lib/services/finance/invoice.service.ts` — PDF generation helper and cancellation/deletion guard paths uncovered (lines 162–184, 312–316, 340–367). Separate ticket required.
- **[TECH DEBT]** No `lib/auth/rbac.ts` exists on this branch. The test-strategy 100% RBAC coverage gate is not applicable today but RBAC logic is inline in middleware and actions — a dedicated `rbac.ts` module with full test coverage should be extracted before v1 ships.
- **[TECH DEBT]** `next` package has moderate advisories (GHSA-mq59-m269-xvcx, GHSA-jcc7-9wpm-mj36, GHSA-ggv3-7p47-pfv8 etc.) requiring a breaking upgrade to `next@16.1.7`. Schedule for next sprint.
- **[TECH DEBT]** `lodash` and `prisma` advisories require `npm audit fix --force` (breaking changes). Schedule dependency review sprint.
- **[TECH DEBT]** Prisma v7.5.0 update available (currently 7.4.1). Minor update, schedule for next sprint.

### Release Notes Draft

#### Features
- Finance module: full double-entry personal finance management with accounts, transaction categories, transactions, clients, invoices with line items, PDF invoice generation, and timesheet tracking
- Finance reports: income/expense summaries with date range and category filtering
- Work logs can now be created without linking to a task (standalone time entries)
- Admin notification emails sent on user registration
- Achievements, Notes, Work Logs, Daily To-Do, and Global Search modules fully implemented
- Module-level feature flags (`moduleFinance`, `moduleWork`) per user account
- User profile: business details, employment type, ABN, bank/payment details for invoice generation

#### Fixes
- Task status `IN_REVIEW` removed; existing tasks in that state migrated to `Done`
- Client currency backfilled to match user's configured currency (previously defaulted to GBP regardless of user setting)

#### Internal
- 16 Prisma migrations establishing the full schema from initial user table through finance module
- Finance schemas, services, and Server Actions added for accounts, categories, clients, invoices, transactions, timesheets, reports, and line items
- PDF generation via React-PDF / `@react-pdf/renderer` for invoice downloads
- Email notification integration via Resend for admin alerts
- 472 unit tests across 32 test suites

---

## Verdict

**BLOCKED — NOT READY TO MERGE**

6 blockers must be resolved before this branch can merge to main:
1. Fix 9 TypeScript type-check errors (filter type mismatch in 5 files)
2. Fix build failure caused by the same type errors
3. Remediate 12 high-severity npm audit vulnerabilities (run `npm audit fix` for the non-force-required packages immediately)
4. Bring 8 service files up to ≥90% statement/branch coverage gate
5. Document and confirm a rollback plan for the `remove_budget_module` migration tested on staging DB
6. Document and confirm staging DB test for the `backfill_client_currency` data migration
