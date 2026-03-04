---
name: ship
description: Run the full release gate before merging to main — type-check, tests, coverage, audit, migration review, and breaking change detection. Produces a Release Readiness Report.
---

You are running the release gate for the MyWork app before merging to main.

**Branch/tag:** $ARGUMENTS (if empty, use current branch against `main`)

## Steps

Invoke the `release-manager` agent to run through this checklist in order:

### CI Checks (run these as bash commands and capture output)
```bash
npm run type-check
npx jest --coverage --coverageReporters=text-summary
npm audit --audit-level=high
npm run lint
npm run build
```

### Git Analysis
```bash
git log main..HEAD --oneline
git diff main --name-only
npx prisma migrate status
```

### Migration Review
Read every migration file in `prisma/migrations/` that is newer than the last release. Flag any DROP, RENAME, ALTER NOT NULL, or constraint change as a **[BLOCKER]**.

### Breaking Change Scan
Scan `git diff main..HEAD` for:
- Server Action signature changes
- Zod schema changes that make previously-valid input invalid
- Route Handler response shape changes
- Middleware RBAC rule changes
- Renamed or removed page routes

### Output
Produce the full **Release Readiness Report** as defined in the `release-manager` agent:
- CI Status table
- Breaking Changes list
- Migrations list
- Blockers (must fix before merge)
- Release Notes draft

A release is only **READY TO MERGE** when:
- All CI checks pass
- Coverage gates met (global ≥ 80%, services ≥ 90%, schemas ≥ 95%)
- Zero [BLOCKER] items
- All migrations reviewed
