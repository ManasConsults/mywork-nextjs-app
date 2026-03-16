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
