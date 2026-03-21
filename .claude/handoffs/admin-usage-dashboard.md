## Stage Completed: developer — 2026-03-21

### Summary
Built a production-grade admin usage dashboard at `app/admin/page.tsx`. The page replaces the previous redirect-to-users stub and renders a responsive stat-card row (6 cards: users, tasks, work logs, achievements, notes, todos) plus a per-user activity table with role badges, avatar initials, module counts, and a relative "last active" timestamp. All data is fetched server-side via a new `getAppUsageStats` service that issues two concurrent database operations — a `$transaction` for all count/findMany queries and a `Promise.all` of `groupBy` queries for last-active computation — to minimise round-trips. The admin layout was also updated to add a "Dashboard" nav link alongside the existing "Users" link.

### Artifacts Produced
- `lib/services/admin.service.ts` — `getAppUsageStats()` returning `AppUsageStats` with global totals and per-user `UserUsageStats[]` sorted by `lastActiveAt` descending
- `lib/services/admin.service.test.ts` — 9 unit tests covering totals, per-user counts, lastActiveAt max-selection, null handling, sort order, and call counts
- `app/admin/page.tsx` — RSC dashboard page with stat cards, user activity table, empty state, and a pure-JS relative-time helper
- `app/admin/layout.tsx` — added "Dashboard" nav link to the admin header

### Decisions Made
- `$transaction` is used only for the PrismaPromise queries (counts + findMany). The `groupBy` queries are run in a separate `Promise.all` because `Promise.all` is not a `PrismaPromise` and cannot be mixed into a `$transaction` array.
- Both batches are wrapped in an outer `Promise.all` so they execute concurrently rather than sequentially.
- `lastActiveAt` is computed in JS by iterating five `groupBy` result sets and merging the max `createdAt` per `userId` into a `Map`. This avoids N+1 queries while staying within plain Prisma (no raw SQL).
- Soft-delete filter (`deletedAt: null`) is applied to tasks, achievements, and notes in all queries. `WorkLog` and `TodoItem` have no `deletedAt` column in the schema so they are counted without a filter.
- The `relativeTime` helper is implemented as a plain function in the RSC page — no `date-fns` or similar dependency added.
- The Tailwind `min-w-[720px]` was written as `min-w-180` per the project's canonical-classes lint rule.

### Known Issues / Deferred
- The admin layout still uses grey (`gray-*`) Tailwind classes rather than the zinc-based design system used by the rest of the app. This pre-existed this work; aligning it is deferred.
- No pagination on the user activity table. For large user bases (hundreds of users) this will need server-side pagination or virtualisation.
- `lastActiveAt` only considers `createdAt` on records, not `updatedAt`. If an update-heavy workflow matters, the groupBy could be extended to `_max: { updatedAt: true }` and the later of the two dates used.

### Next Stage Instructions
Run the tester agent on these files:
- `lib/services/admin.service.ts`
- `lib/services/admin.service.test.ts`
- `app/admin/page.tsx`

Acceptance criteria to verify:
1. `npm run type-check` exits 0 with no errors.
2. All 9 tests in `lib/services/admin.service.test.ts` pass.
3. The dashboard page renders stat cards for all 6 modules using the correct Prisma model counts with soft-delete filters applied to tasks, achievements, and notes.
4. The user activity table shows one row per user with name/email, role badge, per-module counts (zero shown as em dash), and a relative last-active date.
5. Users with no activity records show `null` for `lastActiveAt` and sort to the bottom of the table.
6. The admin layout exposes both a "Dashboard" and "Users" nav link.
