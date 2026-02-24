# Release Checklist

## Work Management Application — *MyWork*

| Field          | Value                                                         |
|----------------|---------------------------------------------------------------|
| Document ID    | RC-001                                                        |
| Version        | 1.0                                                           |
| Status         | Draft                                                         |
| Author         | Release Management                                            |
| Date           | 2026-02-24                                                    |
| Related Docs   | BRD-001 · SAD-001 · TDD-001 · TS-001                         |
| Reviewers      | Tech Lead, QA Lead, Product Owner, Platform                   |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Release Types & Schedule](#2-release-types--schedule)
3. [Pre-Release Checklist](#3-pre-release-checklist)
4. [Release Execution Procedure](#4-release-execution-procedure)
5. [Smoke Test Suite](#5-smoke-test-suite)
6. [Rollback Procedure](#6-rollback-procedure)
7. [Post-Release Monitoring](#7-post-release-monitoring)
8. [Incident Response](#8-incident-response)
9. [Communication Templates](#9-communication-templates)
10. [Release Sign-Off Record](#10-release-sign-off-record)

---

## 1. Introduction

### 1.1 Purpose

This document is the single authoritative checklist for every production release of *MyWork*. It covers the end-to-end release lifecycle: pre-release verification, deployment execution, smoke testing, rollback, monitoring, and incident response.

**This checklist is mandatory.** No release proceeds to production without each applicable checkbox confirmed by the responsible role.

### 1.2 Roles & Responsibilities

| Role               | Abbreviation | Responsibility during release                                            |
|--------------------|--------------|--------------------------------------------------------------------------|
| Release Manager    | RM           | Owns the process; runs the checklist; makes go/no-go decisions.          |
| Tech Lead          | TL           | Approves migrations; reviews breaking changes; available during window.   |
| QA Lead            | QA           | Signs off on test gate; leads smoke testing; escalates defects.           |
| On-Call Engineer   | OC           | Monitors dashboards; first responder for alerts during release window.    |
| Product Owner      | PO           | Approves feature readiness; owns stakeholder communication.               |
| Platform           | PL           | Vercel and database access; executes rollback if needed.                  |

### 1.3 Key Infrastructure

| Component          | Platform               | Access                                      |
|--------------------|------------------------|---------------------------------------------|
| Application hosting| Vercel                 | Vercel Dashboard / `vercel` CLI             |
| Database           | Managed PostgreSQL      | Provider dashboard + `psql` / Prisma Studio |
| Email              | Resend                 | Resend Dashboard                            |
| Error tracking     | Sentry                 | Sentry Dashboard                            |
| Uptime monitoring  | Vercel Analytics + external ping | Dashboard + PagerDuty           |
| CI/CD              | GitHub Actions         | GitHub repository Actions tab               |
| Source control     | GitHub                 | `main` branch (protected)                   |

---

## 2. Release Types & Schedule

### 2.1 Release Classification

| Type              | Trigger                                          | Notice period | Window              |
|-------------------|--------------------------------------------------|---------------|---------------------|
| **Standard**      | Planned feature release from `develop` → `main` | 48 hours      | Tuesday–Thursday, 10:00–14:00 local |
| **Patch**         | P2/P3 bug fix; no schema changes                 | 24 hours      | Any weekday, 10:00–14:00 local |
| **Hotfix**        | P0/P1 production incident                        | None          | Immediately; any time |
| **Schema-heavy**  | Contains destructive DB migration (phase 2)       | 72 hours      | Tuesday only, 10:00–11:00 local (low traffic) |

### 2.2 Release Window Policy

- **Standard releases** are scheduled during Tuesday–Thursday 10:00–14:00 to allow same-day incident resolution without weekend work.
- **No releases on Fridays, weekends, or the day before a public holiday** (unless P0 hotfix).
- **On-call engineer** must be confirmed available for 2 hours beyond the release window close.
- The release window closes when smoke tests pass and monitoring is stable. If not achieved within 2 hours, rollback is initiated.

### 2.3 Branch-to-Environment Mapping

```
feature/* ──── PR ────► develop ──── CI ────► staging (auto-deploy)
                                                  │
                              Release PR ──────────►  main ──► production (manual trigger)
```

---

## 3. Pre-Release Checklist

Complete this checklist **at least 24 hours before** the release window. Items marked `[TL]`, `[QA]`, `[RM]` denote the responsible role.

### 3.1 Code & Quality Gate

- [ ] `[TL]` Release PR from `develop` → `main` is open and all CI checks are green.
- [ ] `[TL]` All feature branches for this release have been merged to `develop`; no open PRs targeting this release are pending.
- [ ] `[QA]` All CI quality gates from TS-001 §15.1 have passed on the `develop` branch within the last 24 hours:
  - [ ] TypeScript + ESLint + Prettier: ✅
  - [ ] Jest unit tests: ✅ (coverage ≥ 80% globally; `rbac.ts` = 100%)
  - [ ] Integration tests: ✅ (all RS-01–RS-10 scenarios passing)
  - [ ] `npm audit --audit-level=high`: 0 high/critical CVEs ✅
  - [ ] `next build`: ✅ (no build errors or warnings)
  - [ ] E2E (Playwright, full browser matrix): ✅
  - [ ] Lighthouse CI: LCP < 2.5s ✅; no metric regression > 5 points ✅
  - [ ] OWASP ZAP baseline scan on staging: 0 errors ✅
- [ ] `[QA]` Manual accessibility checklist (TS-001 §9.3) completed on staging. All WCAG 2.1 AA items confirmed.
- [ ] `[QA]` Nightly test suite has passed at least once within the last 48 hours with 0 E2E failures (excluding quarantined flakes).

### 3.2 Database & Migrations

- [ ] `[TL]` Review all Prisma migrations in this release:
  - List migrations: `git diff main..develop -- prisma/migrations/`
  - [ ] Confirm all changes are **additive** (new columns with defaults, new tables, new indexes).
  - [ ] If any **destructive migration** (column drop, type change) is present: confirm this is a Phase 2 migration and Phase 1 was deployed at least one release ago.
- [ ] `[TL]` Migration has been tested on a **copy of the production database snapshot** (not just the test DB):
  ```bash
  # Restore prod snapshot to a temporary DB
  psql $TEMP_DB_URL < prod_snapshot_$(date +%Y%m%d).sql
  # Run migrations against snapshot
  DATABASE_URL=$TEMP_DB_URL npx prisma migrate deploy
  # Verify no errors; spot-check key tables
  ```
- [ ] `[TL]` Estimated migration run time on production data volume is documented: `_______ seconds`.
  - If > 30 seconds: **schema-heavy release window** required (Tuesday 10:00–11:00).
  - If > 300 seconds: migration must be broken up; release blocked.
- [ ] `[PL]` Confirmed that a **full database backup** will be taken immediately before migration runs (automated daily backup is not sufficient for this).
- [ ] `[TL]` Prisma schema `generator client` and `datasource db` blocks are correct for production (no local overrides committed).

### 3.3 Environment & Configuration

- [ ] `[PL]` All required environment variables for this release are set in the **Vercel Production** environment (not just preview):
  - [ ] `DATABASE_URL` (Prisma Accelerate production endpoint)
  - [ ] `NEXTAUTH_SECRET` (32-byte random; unchanged unless explicitly rotating)
  - [ ] `NEXTAUTH_URL` (set to production URL)
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM`
  - [ ] Any **new** env vars introduced in this release: `________________`
- [ ] `[PL]` New env vars have been validated against `env.ts` (`@t3-oss/env-nextjs`) to confirm the build will not fail.
- [ ] `[TL]` `next.config.ts` — confirm no `typescript.ignoreBuildErrors` or `eslint.ignoreDuringBuilds` flags are set to `true`.
- [ ] `[RM]` Vercel project settings — confirm production branch is `main` and **auto-deploy on push to main is DISABLED** (we trigger manually).

### 3.4 Feature Flags & Functionality

- [ ] `[PO]` All features in this release have been accepted on **staging** by the Product Owner.
- [ ] `[RM]` Changelog / release notes have been drafted and reviewed.
- [ ] `[RM]` Any **breaking changes** are identified and documented:
  - Breaking changes in this release: `________________` (or "None")
  - User communication required: `Yes / No`
  - Admin notification required: `Yes / No`

### 3.5 Dependency & Security Review

- [ ] `[TL]` All new npm dependencies added in this release have been reviewed:
  - Dependency name + version + justification: `________________`
  - Confirmed no licence conflicts (avoid GPL, AGPL in production).
  - Snyk or npm audit shows no known vulnerabilities in the new dependency.
- [ ] `[TL]` No `node_modules` or secret files (.env) are tracked in git.
  - Verify: `git ls-files | grep -E '(node_modules|\.env$)'` → empty output.

### 3.6 Stakeholder Communication

- [ ] `[RM]` Maintenance window notification sent to users (if downtime > 0s is expected): at least **48 hours** in advance.
- [ ] `[RM]` Engineering team notified of release time and window.
- [ ] `[OC]` On-call engineer confirmed available during the release window + 2 hours after.
- [ ] `[PL]` Platform engineer confirmed available with Vercel and database access.
- [ ] `[RM]` Status page (if configured) shows "Planned Maintenance" for the release window.

---

## 4. Release Execution Procedure

> **Time boxing:** If any step takes longer than expected and the total elapsed time exceeds **90 minutes**, initiate rollback (§6) and reschedule.

### 4.1 T-60 Minutes — Preparation

```
[ ] RM  - Open release checklist; confirm all pre-release items are complete.
[ ] OC  - Open monitoring dashboards (Vercel Analytics, Sentry, uptime monitor).
          Baseline the following BEFORE deployment:
          - Error rate (last 30 min): _______ errors/min
          - P95 API latency (last 30 min): _______ ms
          - Active sessions: _______
[ ] PL  - Confirm database backup is current:
          Check provider dashboard — last backup timestamp: _______
          Manually trigger backup if last backup > 6 hours ago.
[ ] TL  - Open Vercel dashboard; confirm staging deployment is the build
          being promoted to production.
[ ] RM  - Start the release communication thread in Slack (#releases).
          Post: "🚀 Release [VERSION] starting at [TIME]. On-call: [NAME]."
```

### 4.2 T-30 Minutes — Database Migration

> This step runs **before** the application deployment to ensure the new schema is in place when the new application code boots. All migrations must be backward-compatible with the **current** production application code.

```bash
# Step 1: Verify current migration state on production
DATABASE_URL=$PROD_DB_URL npx prisma migrate status
# Expected: "Database schema is up to date!" for all existing migrations.
# All listed should be "Applied". Note any that are not.

# Step 2: Preview what will be applied (dry run — inspect output carefully)
DATABASE_URL=$PROD_DB_URL npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script

# Step 3: Take manual pre-migration backup (confirm with PL)
# Provider-specific — e.g., Neon:
# Dashboard → Project → Branches → Create restore point "pre-release-[VERSION]"

# Step 4: Apply migrations
DATABASE_URL=$PROD_DB_URL npx prisma migrate deploy
# Record output and time taken: _______ seconds
# Expected: "All migrations have been successfully applied."
```

- [ ] `[TL]` Migration completed successfully with no errors.
- [ ] `[TL]` Spot-check production database post-migration:
  - New columns/tables exist: `\d "TableName"` in psql
  - Row counts are unchanged (no data loss): `SELECT COUNT(*) FROM "Task";` etc.
  - Search vectors still populated: `SELECT COUNT(*) FROM "Task" WHERE "searchVector" IS NULL;` → 0

### 4.3 T-0 — Application Deployment

```bash
# Option A: Vercel Dashboard
# 1. Navigate to vercel.com/[team]/[project]/deployments
# 2. Find the staging deployment that QA approved
# 3. Click "..." → "Promote to Production"
# 4. Confirm in the dialog

# Option B: Vercel CLI
vercel promote [DEPLOYMENT_URL] --scope=[TEAM_SLUG]
# Confirm prompt: "Are you sure you want to promote this deployment?" → y
```

```
[ ] PL  - Confirm deployment promotion triggered in Vercel.
[ ] OC  - Watch Vercel deployment log for build errors during promotion.
          Vercel promotes instantly (no rebuild for promotion) — confirm
          "Deployment promoted to production" appears in the log.
[ ] OC  - Verify production URL returns HTTP 200:
          curl -I https://mywork.example.com | grep "HTTP/2 200"
[ ] OC  - Confirm Vercel shows the correct deployment SHA matches
          the commit at the tip of the release PR.
          Expected SHA: _______ (from the release PR)
          Actual SHA in Vercel: _______
```

- [ ] `[PL]` Application is live on production URL with correct deployment SHA.
- [ ] `[OC]` No spike in error rate in first 2 minutes post-deployment (Sentry).

### 4.4 T+5 Minutes — Immediate Verification

```
[ ] OC  - Verify /api/health (or equivalent) returns 200.
          curl https://mywork.example.com/api/health
[ ] OC  - Confirm Sentry is receiving events from production
          (new deployment marker should appear in Sentry timeline).
[ ] OC  - Check Vercel Function log for any runtime errors in first 5 minutes.
[ ] TL  - Confirm database connection pool (Prisma Accelerate) shows
          active connections and no connection errors.
```

→ **If any of the above show errors: initiate rollback immediately (§6). Do not proceed to smoke tests.**

### 4.5 T+5 to T+30 Minutes — Smoke Testing

Run the full smoke test suite (§5). This is performed by QA Lead on the **production URL**.

- [ ] `[QA]` All smoke tests pass (§5 checklist completed and signed).
- [ ] `[OC]` No anomalies in monitoring dashboards during smoke testing.

→ **If any smoke test fails: initiate rollback immediately (§6).**

### 4.6 T+30 Minutes — Go/No-Go Decision

```
[ ] RM  - Poll all roles for final go/no-go:
          Tech Lead: GO / NO-GO — Reason: _______
          QA Lead:   GO / NO-GO — Reason: _______
          On-Call:   GO / NO-GO — Reason: _______
```

- **All GO** → release is confirmed. Proceed to §7 (Post-Release Monitoring).
- **Any NO-GO** → initiate rollback (§6). Document reason.

```
[ ] RM  - Post to Slack (#releases):
          "✅ Release [VERSION] is LIVE. Monitoring continues for 2 hours."
          OR
          "❌ Release [VERSION] ROLLED BACK. Reason: _______. Post-mortem scheduled."
[ ] RM  - Merge the release PR to main (if not already merged as part of promotion).
[ ] TL  - Tag the production commit: git tag v[VERSION] && git push --tags
[ ] RM  - Update status page to "All Systems Operational" (if maintenance was shown).
```

---

## 5. Smoke Test Suite

> Execute these tests on **production** immediately after deployment. Use a dedicated QA smoke test account — never a real user account. Each step should take no more than 2 minutes.

### 5.1 Critical Path Smoke Tests

#### AUTH-01 — Sign In

```
1. Navigate to https://mywork.example.com/login
2. Enter smoke test account credentials.
3. Click "Sign in".
Expected: Redirected to /dashboard. Nav, sidebar, and page title visible.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### AUTH-02 — Unauthenticated Redirect

```
1. Open incognito window.
2. Navigate directly to https://mywork.example.com/tasks
Expected: Redirected to /login. Original URL NOT exposed in the redirect.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### TASK-01 — Create a Task

```
1. Navigate to /tasks.
2. Click "New Task".
3. Enter title: "SMOKE TEST [timestamp]". Click "Create Task".
Expected: Success toast appears. Task appears in the task list.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### TASK-02 — Edit Task Status

```
1. Click the task created in TASK-01.
2. Change status from "Backlog" to "In Progress".
3. Save.
Expected: Status badge updates. updatedAt timestamp refreshes.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### WLOG-01 — Log Work Against a Task

```
1. From the task detail created in TASK-01, click "Log Work".
2. Enter: Date = today, Description = "Smoke test log entry", Time = 30 min.
3. Save.
Expected: Work log entry appears in the task's work log section.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### TODO-01 — Create and Complete a To-Do

```
1. Navigate to /todos.
2. Quick-add a to-do: title = "SMOKE TEST TODO".
3. Press Enter (item saves). Check the checkbox to mark complete.
Expected: Item shows line-through styling. Progress counter increments.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### NOTE-01 — Create a Note

```
1. Navigate to /notes. Click "New Note".
2. Type a title: "Smoke note". Type body: "Smoke test body content."
3. Save.
Expected: Note appears in the notes list with title and preview.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### ACH-01 — Record an Achievement

```
1. Navigate to /achievements. Click "Record Achievement".
2. Enter title: "SMOKE TEST ACH". Description: "Automated smoke test."
3. Save.
Expected: Achievement appears in the list.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### SEARCH-01 — Global Search

```
1. Press Cmd+K (Mac) or Ctrl+K (Windows).
2. Type "SMOKE TEST".
Expected: Results appear grouped by module: Task "SMOKE TEST [timestamp]",
          Note "Smoke note", Achievement "SMOKE TEST ACH" all visible.
          Results appear within 2 seconds.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### ADMIN-01 — Admin Panel Access (Admin account)

```
1. Sign out. Sign in with Admin smoke test account.
2. Navigate to /admin/users.
Expected: User list loads. Pagination visible. No 403 error.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### ADMIN-02 — RBAC Guard (Member account)

```
1. Sign out. Sign in with Member smoke test account.
2. Navigate directly to /admin/users.
Expected: 403 Forbidden page shown. Member cannot access admin panel.
[ ] PASS  [ ] FAIL — Notes: _______
```

#### PERF-01 — Page Load Time

```
1. In Chrome, open DevTools → Network → clear cache.
2. Navigate to /tasks.
3. Check "LCP" in Performance tab or Web Vitals extension.
Expected: LCP < 2.5 seconds (BRD NFR-P1).
Actual LCP: _______ ms
[ ] PASS  [ ] FAIL — Notes: _______
```

#### EMAIL-01 — Email Delivery (Staging only for standard releases)

> Skip for hotfix releases. On production, verify only the email template renders — do not send to real addresses.

```
1. (Staging) Admin: invite a new user with email smoketest+[timestamp]@mywork.test.
Expected: Resend Dashboard shows email sent. Preview link valid.
[ ] PASS  [ ] FAIL  [ ] SKIPPED (hotfix) — Notes: _______
```

### 5.2 Smoke Test Result Summary

| Test ID  | Result        | Notes       |
|----------|---------------|-------------|
| AUTH-01  | PASS / FAIL   |             |
| AUTH-02  | PASS / FAIL   |             |
| TASK-01  | PASS / FAIL   |             |
| TASK-02  | PASS / FAIL   |             |
| WLOG-01  | PASS / FAIL   |             |
| TODO-01  | PASS / FAIL   |             |
| NOTE-01  | PASS / FAIL   |             |
| ACH-01   | PASS / FAIL   |             |
| SEARCH-01| PASS / FAIL   |             |
| ADMIN-01 | PASS / FAIL   |             |
| ADMIN-02 | PASS / FAIL   |             |
| PERF-01  | PASS / FAIL   | LCP: ___ ms |
| EMAIL-01 | PASS / FAIL / SKIPPED | |

**Overall: `ALL PASS` → continue. Any `FAIL` → rollback (§6).**

QA Lead sign-off: _________________ Date/Time: _________________

### 5.3 Smoke Test Data Cleanup

After smoke tests pass, clean up test data to keep production clean:

```
[ ] QA  - Archive (not delete) the smoke test task created in TASK-01.
[ ] QA  - Delete the smoke test achievement created in ACH-01.
[ ] QA  - Delete the smoke test to-do created in TODO-01 (already completed).
[ ] QA  - Delete the smoke test note created in NOTE-01.
[ ] QA  - Deactivate the smoke test invited user (ADMIN panel) if EMAIL-01 was run.
```

---

## 6. Rollback Procedure

> **Rollback is not a failure. It is the correct response to an unexpected production issue. When in doubt, roll back first and investigate after.**

### 6.1 Rollback Decision Criteria

Initiate rollback immediately if ANY of the following are observed:

| Trigger | Threshold | Who decides |
|---------|-----------|-------------|
| HTTP 5xx error rate | > 1% for > 2 minutes | OC (immediate) |
| Any smoke test FAIL | Any failure | QA + RM |
| P95 API latency increase | > 50% above pre-release baseline | OC |
| Sentry new issue spike | > 10 new unique errors within 5 minutes | OC |
| Database migration error | Any error | TL (immediate) |
| Auth broken (login fails) | Any failure | OC (immediate) |
| Data integrity violation observed | Any | TL (immediate) |
| Release window exceeded | > 90 minutes elapsed | RM (automatic) |

**Rollback does not require consensus — any P0-triggering person can call a rollback unilaterally.**

### 6.2 Application Rollback (Vercel Instant Rollback)

Vercel preserves all previous deployments. Rollback is **instant** (< 30 seconds) and does not require a rebuild.

```bash
# Option A: Vercel Dashboard (fastest)
# 1. Navigate to vercel.com/[team]/[project]/deployments
# 2. Find the previous production deployment (labelled "Previously in Production")
# 3. Click "..." → "Promote to Production"
# Confirm — previous build is instantly live.

# Option B: Vercel CLI
vercel rollback --scope=[TEAM_SLUG]
# Vercel automatically rolls back to the last known good production deployment.

# Option C: If CLI is unavailable
# Revert the merge commit on main and push — triggers a new deployment
# WARNING: This approach takes 3–5 minutes for a new build. Use dashboard first.
```

```
[ ] PL  - Rollback triggered. Note method used: _______. Time: _______
[ ] OC  - Verify production URL returns HTTP 200 within 60 seconds of rollback.
[ ] OC  - Verify Sentry error rate returns to pre-release baseline within 2 minutes.
[ ] OC  - Verify P95 API latency returns to pre-release baseline.
[ ] RM  - Post to Slack (#releases): "⚠️ [VERSION] rolled back at [TIME]. Reason: _______."
```

### 6.3 Database Rollback

> **Critical:** Application rollback is instant. Database rollback is complex and potentially destructive. Carefully assess which category the migration falls into before acting.

#### Category A — Additive migration only (new columns, new tables)

The old application code is compatible with the new schema (additive changes have defaults or are nullable). **Application rollback is sufficient.** The new columns/tables sit unused until the new application code is re-deployed.

```
ACTION: Application rollback only (§6.2).
Database rollback: NOT REQUIRED.
[ ] TL  - Confirm migration is additive. Database rollback skipped.
```

#### Category B — Migration that altered existing data

If the migration ran a data transformation (backfill, type cast, column rename via new+drop), evaluate carefully.

```
DECISION TREE:
Is the data transformation reversible?
│
├── YES → Write and test a manual reversal script, then apply:
│         psql $PROD_DB_URL < revert_[version].sql
│         Verify row counts and data integrity post-revert.
│
└── NO  → Do NOT attempt database rollback.
          Keep the rolled-back application running against the new schema.
          Open a P0 incident.
          The engineering team must write a forward-fix migration.
          Notify stakeholders of the data state.
```

#### Category C — Dropped column (Phase 2 destructive migration)

Dropped columns cannot be recovered from the migration itself. Recovery requires restoring from the pre-migration backup.

```
# Restore from pre-migration backup (provider-specific)
# Neon: Dashboard → Branches → Restore to "pre-release-[VERSION]" restore point
# This will restore ALL data to the backup point — any writes since backup are LOST.

# BEFORE restoring, estimate data loss window:
# Data written between backup and now: _______ records (check with OC)

# Only proceed with restore if:
# 1. Tech Lead and RM both approve.
# 2. Data loss window is acceptable (< RPO of 24 hours — BRD NFR-R3).
# 3. Users have been notified.

[ ] TL  - Approved DB restore: YES / NO
[ ] RM  - Approved DB restore: YES / NO
[ ] PL  - Restore executed. New DB URL confirmed: _______. Application rollback done.
```

### 6.4 Post-Rollback Steps

```
[ ] OC  - Confirm all monitoring metrics are stable (10 minutes of clean readings).
[ ] TL  - Create a post-mortem ticket: "Release [VERSION] rollback — [brief reason]"
[ ] RM  - Schedule post-mortem within 48 hours (blameless; focus on process).
[ ] RM  - Update release notes to mark version as "rolled back".
[ ] TL  - Identify root cause. Create fix ticket. Estimate next release window.
[ ] RM  - Notify stakeholders of rollback and next expected release date.
```

---

## 7. Post-Release Monitoring

### 7.1 Monitoring Schedule

| Phase        | Duration           | Frequency of dashboard check | Who |
|--------------|--------------------|------------------------------|-----|
| Active watch | 0–2 hours post-release | Every 5 minutes        | OC  |
| Elevated     | 2–24 hours post-release | Every 30 minutes       | OC  |
| Normal       | 24 hours onwards        | Standard alerting only | On-call rotation |

### 7.2 Dashboards to Monitor

Open all of these **before** deployment (to establish baselines) and keep open during active watch:

| Dashboard | What to watch | Alert threshold |
|-----------|---------------|-----------------|
| **Vercel Analytics** | Request count, error rate, function duration | Error rate > 1% → P0 |
| **Vercel Function Logs** | Runtime exceptions, timeout errors | Any new exception pattern → investigate |
| **Sentry** | New issues, issue volume, release health score | > 10 new unique issues in 5 min → P1 |
| **Database provider dashboard** | Connection count, query latency, CPU/RAM | Connection count > 80% pool → P1 |
| **Prisma Accelerate** | Pool utilisation, cache hit rate | Pool > 80% saturated → P1 |
| **Resend dashboard** | Email delivery rate, bounce rate | Delivery rate < 95% → P2 |
| **Uptime monitor** | HTTP 200 from external probe | Any downtime > 30s → P0 |

### 7.3 Baseline vs Actual Metrics

Record pre-release baselines (T-60 min) and compare post-release:

| Metric                    | Pre-release baseline | T+15 min | T+60 min | T+120 min | Status  |
|---------------------------|---------------------|----------|----------|-----------|---------|
| HTTP error rate           | _____%              |          |          |           | OK/Alert|
| P95 API latency           | _____ ms            |          |          |           | OK/Alert|
| P95 search latency        | _____ ms            |          |          |           | OK/Alert|
| Active sessions           | _____               |          |          |           | OK/Alert|
| Sentry new issues (1h)    | _____               |          |          |           | OK/Alert|
| DB connection pool usage  | _____%              |          |          |           | OK/Alert|
| Vercel function P95       | _____ ms            |          |          |           | OK/Alert|

### 7.4 Automated Alerts (PagerDuty / Vercel Alerts)

Confirm these alerts are active and routed to the on-call engineer before every release:

| Alert Name                      | Condition                         | Severity | Destination       |
|---------------------------------|-----------------------------------|----------|-------------------|
| High HTTP error rate            | 5xx rate > 1% for 5 minutes       | P0       | PagerDuty → OC    |
| API P95 latency degradation     | P95 > 500ms for 10 minutes        | P1       | PagerDuty → OC    |
| Database connection saturation  | Pool > 90% for 5 minutes          | P0       | PagerDuty → OC+PL |
| Uptime failure                  | 2 consecutive probe failures      | P0       | PagerDuty → OC    |
| Sentry error spike              | > 20 new unique errors per hour   | P1       | Slack + OC        |
| Prisma Accelerate pool warning  | Pool > 80%                        | P2       | Slack             |

### 7.5 Synthetic Monitoring (Post-Release)

After active watch concludes, a synthetic monitor runs every 5 minutes to verify the critical path:

```
Monitor target: https://mywork.example.com/api/health
Method: GET (with valid session cookie from service account)
Expected: HTTP 200, response < 1000ms
Alert on: 2 consecutive failures → PagerDuty P0
```

### 7.6 24-Hour Post-Release Review

At T+24 hours, the on-call engineer and RM review:

```
[ ] OC  - Review Sentry release health score. Target: > 99% session health.
[ ] OC  - Review Vercel Analytics for any abnormal function duration percentiles.
[ ] OC  - Verify database backup ran successfully post-release (check provider dashboard).
[ ] QA  - Review any user-reported issues logged in the support channel since release.
[ ] RM  - Post T+24 summary to #releases:
          "Release [VERSION] — T+24h status: ✅ Stable / ⚠️ Issues noted: _______"
```

---

## 8. Incident Response

### 8.1 Severity Classification

| Severity | Definition | Examples | Response time | Comms cadence |
|----------|------------|----------|---------------|---------------|
| **P0** | Production is down or a security breach is confirmed | Login broken for all users, data leaking across accounts, HTTP 500 on all routes | Immediate (any hour) | Every 15 minutes |
| **P1** | Core feature broken for all users; significant data integrity issue | Cannot create tasks, search returning 0 results, email not sending | Within 30 minutes | Every 30 minutes |
| **P2** | Feature degraded; workaround exists | Filter not working, to-do reorder broken | Within 4 hours (business hours) | Every 2 hours |
| **P3** | Minor issue; no data impact | UI misalignment, tooltip broken | Next business day | Once on resolution |

### 8.2 Incident Response Steps

#### Step 1 — Detect & Classify (0–5 minutes)

```
[ ] OC  - Alert received (automated or user-reported).
[ ] OC  - Triage: confirm the issue is real (not a false alarm from a single user).
          Quick checks:
          - curl https://mywork.example.com/api/health → HTTP 200?
          - Sentry: new error volume spiking?
          - Vercel logs: 5xx errors?
[ ] OC  - Classify severity (P0 / P1 / P2 / P3).
[ ] OC  - If P0 or P1: immediately notify RM and TL via phone/Slack.
          Do not wait to fully understand the issue before notifying.
```

#### Step 2 — Assemble Response Team (5–10 minutes)

```
[ ] RM  - Open incident Slack channel: #incident-[YYYYMMDD]-[short-description]
[ ] RM  - Assign roles:
          Incident Commander (IC): _______ (usually RM for P0/P1)
          Technical Lead: _______
          Communications Lead: _______ (usually RM)
          Scribe: _______ (documents timeline in the channel)
[ ] RM  - Start an incident document (copy §8.5 template).
```

#### Step 3 — Contain (10–30 minutes)

```
[ ] TL  - Determine if rollback will resolve the incident.
          If yes → initiate rollback (§6) immediately.
          If no (e.g., data already corrupted, rollback won't help) → proceed to diagnosis.

[ ] TL  - Containment options in priority order:
          1. Vercel rollback (fastest, < 30s)
          2. Feature flag to disable broken feature (if available)
          3. Maintenance mode page (return 503 with message)
          4. Database restore from backup (last resort — data loss risk)

[ ] OC  - Verify containment is effective:
          Error rate returning to baseline? YES / NO
          Core paths (login, task list) working? YES / NO
```

#### Step 4 — Diagnose (parallel with containment)

```
[ ] TL  - Check Vercel function logs for the time window of the incident:
          What error message appears? _______
          Which route/function is failing? _______
[ ] TL  - Check Sentry for the first occurrence of the new error:
          First seen: _______
          Stack trace points to: _______
[ ] TL  - Check database: are queries succeeding?
          DB error in logs? YES / NO
          Connection pool exhausted? YES / NO
          Migration partially applied? YES / NO
[ ] TL  - Identify root cause. Document in incident channel.
```

#### Step 5 — Resolve

```
[ ] TL  - Implement fix:
          Option A: Code fix → deploy as hotfix (standard CI gate, abbreviated):
                    TypeScript + ESLint → Unit tests (no E2E required for P0) → Build → Deploy
          Option B: Configuration change in Vercel env vars → redeploy
          Option C: Database fix script (reviewed by TL before running)

[ ] OC  - Verify fix resolves the incident:
          Error rate back to baseline? YES / NO
          Affected users can complete their workflow? YES / NO
          Sentry shows new errors are no longer occurring? YES / NO

[ ] RM  - Declare incident resolved. Time resolved: _______
          Total incident duration: _______ minutes
```

#### Step 6 — Communicate Resolution

```
[ ] RM  - Update status page to "All Systems Operational".
[ ] RM  - Post resolution message to #releases and #incident channel.
[ ] RM  - If users were affected: send user-facing notification (§9.3).
[ ] RM  - Schedule post-mortem within 48 hours of resolution (P0/P1).
```

### 8.3 Blameless Post-Mortem

Every P0 and P1 incident requires a post-mortem within 48 hours. Agenda:

| Section | Content |
|---------|---------|
| Summary | 2-sentence description: what happened, impact, duration. |
| Timeline | Chronological events from first alert to resolution. |
| Root Cause | The single underlying technical or process failure. |
| Contributing Factors | What made the root cause more likely or harder to detect. |
| Impact | Users affected, data at risk, revenue/reputation impact. |
| What Went Well | Detection speed, communication, containment effectiveness. |
| What Needs Improvement | Process gaps, missing alerts, inadequate tests. |
| Action Items | Owner + deadline for each improvement. |

**Post-mortem is NOT a blame exercise. The goal is systemic improvement.**

### 8.4 Escalation Path

```
Severity P0 / P1
    │
    ▼
On-Call Engineer (OC)
    │ Not resolved in 15 min
    ▼
Tech Lead (TL)
    │ Not resolved in 30 min
    ▼
Release Manager (RM) — notifies Product Owner
    │ Not resolved in 60 min
    ▼
Engineering Manager — considers external support (Vercel support, DB provider support)
```

### 8.5 Incident Log Template

```markdown
## Incident: [SHORT DESCRIPTION]

- **Date:** YYYY-MM-DD
- **Severity:** P0 / P1 / P2
- **Incident Commander:** [NAME]
- **Status:** Investigating / Contained / Resolved

### Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Alert triggered / issue reported |
| HH:MM | On-call notified |
| HH:MM | Rollback initiated |
| HH:MM | Root cause identified: [description] |
| HH:MM | Fix deployed |
| HH:MM | Incident resolved |

### Root Cause
[One paragraph]

### Users Affected
[Number / % of users; which features were impacted]

### Action Items
| Item | Owner | Due Date |
|------|-------|----------|
| Add regression test for [scenario] | TL | [DATE] |
| Add alert for [metric] | PL | [DATE] |
```

---

## 9. Communication Templates

### 9.1 Pre-Release User Notification (if maintenance window)

> Send via email + in-app banner at least 48 hours before.

```
Subject: MyWork maintenance window — [DATE] [TIME]

We're releasing an update to MyWork on [DATE] between [TIME] and [TIME].

During this window the application may be briefly unavailable (< 5 minutes expected).

What's changing: [brief feature summary or "performance improvements and bug fixes"]

No action is required from you. Your data is safe and will not be affected.

If you experience any issues after the window, please contact [support email].
```

### 9.2 Release Announcement (internal)

> Post to #releases Slack channel at T+0 (deployment confirmed live).

```
🚀 **MyWork [VERSION] is live!**

**What's new:**
• [Feature 1 — one line]
• [Feature 2 — one line]
• [Bug fix — one line]

**Deployed at:** [TIME UTC]
**Deployed by:** [NAME]
**Monitoring until:** [TIME UTC]
**On-call:** [NAME]

Full changelog: [link]
```

### 9.3 Incident User Notification (P0/P1)

> Send when an incident affects users. Keep factual and brief.

```
Subject: MyWork service disruption — [DATE]

We are aware of an issue affecting [feature/login/etc.] in MyWork.

**Status:** Investigating / We have identified the cause and are working on a fix.
**Impact:** [What users cannot do right now]
**Started:** [TIME UTC]

We will provide an update at [TIME UTC] or sooner if the issue is resolved.

We apologise for the inconvenience. Your data is safe.
```

### 9.4 Incident Resolution Notification

```
Subject: MyWork service restored — [DATE]

The issue affecting [feature] in MyWork has been resolved.

**Resolved at:** [TIME UTC]
**Duration:** [X hours Y minutes]
**What happened:** [One sentence, plain language]
**What we're doing to prevent recurrence:** [One sentence]

Thank you for your patience. If you continue to experience issues, please contact [support email].
```

---

## 10. Release Sign-Off Record

> Complete this section after the release is confirmed successful (T+30 min, all go). Attach to the release PR.

| Field                     | Value                  |
|---------------------------|------------------------|
| Release version           |                        |
| Release date              |                        |
| Release window start      |                        |
| Release window end        |                        |
| Total elapsed time        |                        |
| Migration applied         | Yes / No / N/A         |
| Migration duration        |                        |
| Deployment SHA (production)|                       |
| Smoke tests result        | ALL PASS / FAILED (see log) |
| Rollback required         | Yes / No               |
| Post-release monitoring   | Stable / Issues (see §8 log) |

**Sign-offs:**

| Role             | Name | Signature | Date/Time |
|------------------|------|-----------|-----------|
| Release Manager  |      |           |           |
| Tech Lead        |      |           |           |
| QA Lead          |      |           |           |
| On-Call Engineer |      |           |           |

---

## Appendix A — Quick Reference Card

> Print and keep on hand during release window.

```
╔══════════════════════════════════════════════════════════╗
║        MyWork Release Quick Reference                    ║
╠══════════════════════════════════════════════════════════╣
║  RELEASE STEPS                                           ║
║  T-60  Baseline dashboards. Take DB backup.              ║
║  T-30  Apply Prisma migrations. Verify schema.           ║
║  T-0   Promote Vercel deployment to production.          ║
║  T+5   Verify HTTP 200. Check Sentry. Check logs.        ║
║  T+15  Run smoke tests (§5). All must PASS.              ║
║  T+30  Go/No-Go. If GO → post to Slack. Monitor 2h.     ║
╠══════════════════════════════════════════════════════════╣
║  ROLLBACK TRIGGERS (any one → immediate rollback)        ║
║  • 5xx rate > 1% for 2 min                               ║
║  • Any smoke test FAIL                                   ║
║  • P95 latency +50% above baseline                       ║
║  • > 10 new Sentry errors in 5 min                       ║
║  • Login broken                                          ║
║  • Window > 90 min                                       ║
╠══════════════════════════════════════════════════════════╣
║  ROLLBACK — APPLICATION (< 30 seconds)                   ║
║  Vercel Dashboard → Deployments →                        ║
║  Previous production → ... → Promote to Production       ║
║  OR: vercel rollback --scope=[TEAM]                      ║
╠══════════════════════════════════════════════════════════╣
║  ROLLBACK — DATABASE                                     ║
║  Additive migration only → app rollback sufficient       ║
║  Data transform / destructive → see §6.3                 ║
╠══════════════════════════════════════════════════════════╣
║  ESCALATION                                              ║
║  OC → TL (15 min) → RM+PO (30 min) → Eng Mgr (60 min)  ║
╠══════════════════════════════════════════════════════════╣
║  KEY CONTACTS (fill in before each release)              ║
║  Release Manager:  _________________ / _____________     ║
║  Tech Lead:        _________________ / _____________     ║
║  On-Call:          _________________ / _____________     ║
║  Platform:         _________________ / _____________     ║
║  Vercel Support:   https://vercel.com/support            ║
║  DB Provider:      _________________________________     ║
╚══════════════════════════════════════════════════════════╝
```

---

*End of Document — RC-001 v1.0*
