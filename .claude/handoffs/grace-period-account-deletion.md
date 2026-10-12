# Handoff: Grace-Period Account Deletion — 2026-10-11

Builds on `.claude/handoffs/legal-pages-consent.md` (FR-LEG-01..06, ADR-007/008/009). Same branch: feature/legal-pages-consent.

## Stage Completed: business-analyst — 2026-10-11

## Summary
Replace immediate self-deletion with a 14-day grace period. New nullable `User.deletionRequestedAt` (independent of isActive) marks pending deletion; sign-in blocked (credentials + OAuth); stale JWTs rejected in layouts + export; operator emailed via Resend; daily Vercel Cron (03:00 AEST, `0 17 * * *`) erases eligible accounts via existing `deleteUserAccount`. Admins see pending deletions and can Cancel deletion / Delete now. Admin deletion of other users stays immediate. FR-LEG-05 rewritten, FR-LEG-07 new, AC-UG-01-7 amended, legal copy + docs updated.

## BRD Reference / amendments (BRD-001 v1.6 → v1.7)
- AC-UG-01-7 (replace): "Admin can permanently delete another user's account immediately from the admin panel (not their own); this requires a confirmation dialog and is irreversible and removes all of that user's data via the shared erasure service (FR-LEG-05/07). Users may request deletion of their own account from Profile, which is carried out after a 14-day grace period (FR-LEG-05). The last effective Admin — an active Admin who is not pending deletion — can never be deleted or scheduled for deletion by either route."
- FR-LEG-05 → "Self-Service Account Deletion Request (14-Day Grace Period)"; story: "As a user, I want to request deletion of my account and have it erased after a short grace period, so that I can change my mind and still control my data." ACs: AC-LEG-05-1..17 below (supersede previous AC-LEG-05-*).
- FR-LEG-07 (new) "Scheduled Account Purge and Pending-Deletion Management": AC-LEG-07-1..14.
- AC-LEG-01-5 (amend): /data-deletion explains in-app steps (Profile → Account → Export first → Delete account); sign-in blocked immediately; permanent erasure 14 days after request; cancel within the period by emailing the operator (subject "Cancel account deletion"); email address cannot be re-registered until erasure; disaster-recovery history up to 30 days after permanent deletion; email route (subject "Data deletion request", 30-day response) for users who cannot sign in; Facebook-compatible instructions.
- AC-LEG-01-4 (amend export clause): export-before-delete (sign-in blocked as soon as deletion requested), 14-day grace with cancel by email, user's own record keeping.
- AC-LEG-01-9 (new): Privacy §8 and §10 state grace period, data retained unchanged during it, operator notified by email (Resend), permanent erasure from live DB after it, DR history up to 30 days after permanent deletion.
- AC-LEG-06-3 (new): docs/provider-setup.md lists CRON_SECRET, cron schedule, migration-before-code rule, updated Facebook note.
- Change-log v1.7: "Replaced FR-LEG-05 with 14-day grace-period deletion request; added FR-LEG-07 (scheduled purge, admin cancel/delete-now); amended AC-UG-01-7, AC-LEG-01-4/-5; added AC-LEG-01-9, AC-LEG-06-3."

## Decisions Made
- G1 Nullable `User.deletionRequestedAt DateTime?` + index; independent of isActive/rejectedAt/role; cancel only nulls it. Additive migration, deploys before code.
- G2 Effective admin = role ADMIN AND isActive AND deletionRequestedAt IS NULL. Used by request, Delete now, purge and the FOR UPDATE lock query. A requests → A no longer effective → B (only effective admin) refused. Purging a pending admin never hits LAST_ADMIN; job handles LAST_ADMIN defensively (skip+log+count). Zero-admin via direct DB edits = documented residual risk.
- G3 `deleteAccountAction` keeps confirmation (password / typed email + acknowledgement), calls new `requestAccountDeletion(userId)`: one transaction, same FOR UPDATE admin lock, checks effective-admin rule, sets deletionRequestedAt=now only if null; if already set returns existing date and sends no second email. Returns ActionResult<{ purgeDate: 'YYYY-MM-DD' }>. No data touched.
- G4 Pure `computePurgeAt(requestedAt)` single source of truth: first 17:00 UTC instant ≥ requestedAt + 14×24h. 17:00 UTC = 03:00 AEST (QLD, no DST). Cron `0 17 * * *`. Job eligibility deletionRequestedAt ≤ now − 14×24h (never early; late on missed runs). Displayed date = Australia/Brisbane calendar date of computePurgeAt, "d MMMM yyyy" en-AU. Copy: "scheduled for permanent deletion on <date>".
- G5 Credentials `authorize`: no user/passwordHash → null; !isActive → null (unchanged); verify password; if valid AND deletionRequestedAt set → throw Error `DELETION_PENDING:YYYY-MM-DD` (Brisbane date via helper); else as today. Wrong password → null (generic). LoginForm detects code on result.error → dated message. No session.
- G6 OAuth `signIn`: after findUnique, before profile-sync update: if deletionRequestedAt set → return `/login?error=AccountDeletionPending&deletionDate=YYYY-MM-DD`; do not update name/image. isActive gate unchanged; new OAuth users still created inactive. /login renders message only when deletionDate matches ^\d{4}-\d{2}-\d{2}$.
- G7 Stale JWT: (app) layout adds deletionRequestedAt to existing select; order no session → /login; no row → /login; pending → /login?error=AccountDeletionPending&deletionDate=…; consent → /accept-terms. Same in app/admin/layout.tsx and (consent) page. GET /api/account/export → 401 for pending. Residual: other actions/handlers using only getServerSession accept stale JWT up to 14 days (SA to decide shared guard).
- G8 Client on success: signOut({ callbackUrl: '/?deletionRequested=YYYY-MM-DD' }); landing shows role="status" notice with date + cancel instructions (mailto CONTACT_EMAIL, subject "Cancel account deletion"); validate param. Remove old `?accountDeleted=1` notice (dead).
- G9 Register: pending-deletion emails get the existing "An account with this email already exists." — no new enumeration oracle. /data-deletion documents the email stays reserved until erasure. (Deliberate override of the original spec's "dated message" — prevents revealing deletion state to unauthenticated callers.)
- G10 requestPasswordReset: same success response, no token/email for pending users; resetPassword refuses outstanding tokens for pending users.
- G11 Export section stays above Delete; dialog copy: export first; you will be signed out immediately and cannot sign in or export during the 14 days; email CONTACT_EMAIL to cancel.
- G12 Operator email → CONTACT_EMAIL; subject "MyWork: account deletion requested"; body: user id, requested-at (Brisbane), purge date, link ${APP_URL}/admin/users; NO email/name/content. Sent after commit via new fn in lib/email/notifications.ts following existing pattern. Missing RESEND_API_KEY or failure never fails the request; logger.error({ userId }) only (do not copy existing console.error-with-recipient pattern). No user-facing email (deferred).
- G13 Admin approve/reject/active toggle/role/modules/employment on a pending-deletion target → "Cancel the deletion first", no state change, no emails. Only Cancel and Delete now permitted.
- G14 Cron: GET /api/cron/purge-deleted-accounts, dynamic='force-dynamic', maxDuration=60, requires `Authorization: Bearer ${CRON_SECRET}` (constant-time compare); missing/mismatch/unset secret → 401 (fail closed). vercel.json `{"crons":[{"path":"/api/cron/purge-deleted-accounts","schedule":"0 17 * * *"}]}`. Outside proxy.ts matcher. Crons run on production only; Hobby = daily, within the hour. CRON_SECRET must be set in Vercel production before deploy.
- G15 Job: select eligible ids ordered by deletionRequestedAt, time-boxed loop (~45s), bounded batch; leftovers next run. Use deleteUserAccount with guard: re-check under row lock that deletionRequestedAt still set and ≤ cutoff, else skip (CANCELLED). Per-user failure isolation. Response { purged, skipped, failed, remaining }; 200 if failed=0 else 500. NOT_FOUND = skipped (idempotent). Logs ids/counts only.
- G16 Admin UI: derived status "Deletion pending" takes precedence (destructive-tinted badge + purge date); new filter tab "Deletion pending (n)"; excluded from Active/Pending/Rejected tabs+counts; admin "N pending approval" line and sidebar pendingCount (isActive:false) exclude pending-deletion. Row actions only Cancel deletion + Delete now; role/module/employment controls disabled. New `cancelUserDeletionAction(userId)`: requireAdmin, clears column, logs ids, revalidates; non-pending → "Deletion is not scheduled". Delete now = deleteUserAction (effective-admin rule), confirmation required. Self-targeted actions blocked.
- G17 Admin deletion of OTHER users stays immediate (explicit operator decision; recorded in AC-UG-01-7). Email-route deletion requests handled by operator via Delete now within 30 days after verifying sender.
- G18 No LEGAL_VERSION bump IF production has 0 users with termsVersion='2026-10-11' (release precondition: SELECT count(*) FROM users WHERE "termsVersion"='2026-10-11'). If >0, bump LEGAL_VERSION + LEGAL_LAST_UPDATED to ship date.
- G19 Facebook "Data Deletion Instructions URL" needs instructions, not an SLA; 14 days + ≤30 days DR is reasonable (assumption; lawyer-review). Keep the Facebook-only line on /data-deletion.
- G20 Logs for request/cancel/purge/delete-now: userId, actorId, counts only.

## Acceptance Criteria
Superseded: all previous AC-LEG-05-* (handoff 1..13, BRD 1..7). Immediate hard-delete semantics move to AC-LEG-07-4/-13.

### FR-LEG-05
- AC-LEG-05-1 Given a signed-in user on Profile → Account, when they open "Delete account", then the dialog states sign-in is blocked immediately, the account is permanently erased 14 days after the request, and it can be cancelled by emailing CONTACT_EMAIL; it requires password (credentials) or typed email (OAuth-only) plus acknowledgement; confirm disabled until both; Export section remains above.
- AC-LEG-05-2 Given wrong password / non-matching email, when confirming, then "Confirmation did not match" and deletionRequestedAt stays null.
- AC-LEG-05-3 Given valid confirmation, then deletionRequestedAt = server now in one atomic update; no user data row deleted or modified; isActive and role unchanged; action returns purgeDate = Brisbane date of computePurgeAt.
- AC-LEG-05-4 Given the user is the only effective Admin, then "You are the only administrator. Promote another user to Admin first." and nothing set. Another effective Admin exists → succeeds. A already requested, B requests → B refused.
- AC-LEG-05-5 Given success, then client signs out and lands on /?deletionRequested=YYYY-MM-DD with a role="status" notice showing date + cancel instructions (mailto subject "Cancel account deletion"); malformed param → no notice.
- AC-LEG-05-6 Given a pending-deletion credentials user: wrong password → generic "Invalid email or password", no mention of deletion; correct password → "Your account is scheduled for deletion on <date>. To cancel, email <CONTACT_EMAIL>." and no session cookie.
- AC-LEG-05-7 Given a pending-deletion OAuth user completes provider auth, then no session, lands on /login?error=AccountDeletionPending&deletionDate=… with the same dated message, name/image not updated. Unknown OAuth email → new inactive user as before.
- AC-LEG-05-8 Given a still-valid JWT for a pending user, when requesting any (app) page, any /admin page or /accept-terms, then redirect to /login with the dated message, no page content; GET /api/account/export → 401.
- AC-LEG-05-9 Given already pending, when deleteAccountAction called again with valid confirmation, then success with original purgeDate, deletionRequestedAt unchanged, no second email.
- AC-LEG-05-10 Given a request commits, then exactly one Resend email to CONTACT_EMAIL, subject "MyWork: account deletion requested", body has user id, request time, purge date, /admin/users link; no user email, name or content.
- AC-LEG-05-11 Given Resend unconfigured or throws, then the request still succeeds and the failure is logged with user id only.
- AC-LEG-05-12 Given a pending-deletion email, when someone registers with it, then "An account with this email already exists." (identical to existing), no user created, no deletion state/date revealed.
- AC-LEG-05-13 Given a pending user, requestPasswordReset returns the same success, creates no token, sends no email; resetPassword refuses a previously issued token.
- AC-LEG-05-14 Logs for request/cancel/purge/delete-now contain ids and counts only.
- AC-LEG-05-15 Pending-deletion users with isActive=false are excluded from admin pending-approval count and sidebar badge.
- AC-LEG-05-16 Purge date for request at T = Brisbane date of first 17:00 UTC ≥ T + 14×24h; unit tests at exactly 17:00 UTC, ±1s, month and year rollover.
- AC-LEG-05-17 Unauthenticated deleteAccountAction → "must be signed in" error, nothing changes.

### FR-LEG-07
- AC-LEG-07-1 No / wrong / malformed Authorization header → 401, nothing erased; CRON_SECRET unset → 401.
- AC-LEG-07-2 vercel.json defines the cron for /api/cron/purge-deleted-accounts on `0 17 * * *`.
- AC-LEG-07-3 Users requested 13d23h, 14d0h, 20d ago + users with null deletionRequestedAt: only those ≥14×24h are erased; all others untouched.
- AC-LEG-07-4 Eligible user with soft-deleted rows erased via deleteUserAccount in one transaction, 0 rows remaining across the registry; another user's rows untouched (mandatory two-user isolation); failure rolls back.
- AC-LEG-07-5 Immediate re-run → 200, purged: 0.
- AC-LEG-07-6 Three eligible, one fails → other two erased, 500 with failed: 1, failed user retried next run.
- AC-LEG-07-7 More eligible than the time box allows → stops at budget, reports remaining; next run continues.
- AC-LEG-07-8 Admin cancels between selection and erasure → guarded re-check under row lock skips; not erased.
- AC-LEG-07-9 Run logs contain user ids and counts only.
- AC-LEG-07-10 Pending-deletion admin is purged successfully; any LAST_ADMIN result → skipped, logged, counted.
- AC-LEG-07-11 Admin list: "Deletion pending" badge with scheduled date; "Deletion pending (n)" tab; excluded from Active/Pending/Rejected counts; only Cancel deletion + Delete now; role/module/employment controls disabled.
- AC-LEG-07-12 Admin "Cancel deletion" → deletionRequestedAt null, isActive/rejectedAt/role unchanged, user can sign in; non-admin → "Unauthorized"; not pending → "Deletion is not scheduled".
- AC-LEG-07-13 Admin "Delete now" + confirm → immediate erase via deleteUserAccount; effective-admin protection ("You are the only administrator…"); not self; non-pending users' existing Delete stays immediate (AC-UG-01-7).
- AC-LEG-07-14 Pending user: admin approve/reject/deactivate/role/modules/employment → "Cancel the deletion first", no state change, no emails.

### Legal copy / docs
- AC-LEG-01-5 (amended), AC-LEG-01-9, AC-LEG-01-4 (amended) as above; AC-LEG-06-3 as above.
- AC-LEG-01-10 Playwright smoke: /data-deletion contains "14 days" and the cancel email.

## Edge Cases
- 16:59 vs 17:01 UTC on the boundary day → one day apart (AC-LEG-05-16).
- Cancel/purge race → guarded re-check (07-8). Cancel then re-request → new timestamp, date and email.
- App/DB clock skew → use app server time + the single helper everywhere.
- Unapproved/rejected users can't sign in → admin deletion or email route.
- A pending, C demotes B → C still effective. Direct-DB removal of all others → lockout (documented).
- Both password and OAuth → both blocked. Outstanding reset tokens → refused, purged with user.
- Missed/delayed cron → late never early. Preview deployments don't run crons; manual authenticated calls OK.
- deletionDate URL param is validated display text only (crafted fake date = low severity).
- Pending admin can't cancel own deletion (can't sign in) → another admin or DB.

## Known Issues / Deferred
- User-facing confirmation email; admin alert on cron failure/purge (Vercel logs only).
- Shared session guard for all Server Actions / Route Handlers (G7 residual) — SA decision.
- Operator email is a constant (no env override). Zero-admin recovery needs DB access.
- Pre-existing: OAuth linking by email without verified-email check; no rate limit on password confirmation.
- Lawyer review of retention wording / 14 + 30 days.
- Release: G18 count check; set CRON_SECRET in Vercel production; migration before code.

## SA_REVIEW_REQUIRED: true
Triggers: new infra (Vercel Cron, vercel.json, CRON_SECRET, maxDuration/batch); migration (deletionRequestedAt + index); auth callback changes (authorize coded throw; signIn URL return + skip profile sync; no JWT/session type change); changed RBAC invariant (effective admin in FOR UPDATE lock; guarded purge variant; requestAccountDeletion service); new email; shared session guard decision; ADR-010.

## Next Stage Instructions
SA: rule on service shape (requestAccountDeletion; guarded purge variant/parameter on deleteUserAccount), NextAuth v4 authorize-throw and signIn-URL mechanics (verify against node_modules/next-auth source), cron maxDuration/batch/time box, shared guard question; write ADR-010; binding constraints. Then Developer.

---

## Stage Completed: solution-architect — 2026-10-11

### Verdict: APPROVED WITH CONDITIONS
Conditions = the binding constraints below (notably C2 lock SQL, C6 time box, C9 live-session guard).

### Fitness Check
| Concern | Result | Notes |
|---------|--------|-------|
| Module isolation | PASS | `lib/legal/deletion.ts` pure/client-safe (no Prisma) so LoginForm/UserTable can import it. Service-only Prisma. Email fn in `lib/email`, orchestration in actions; services do not import services or email. |
| Data ownership | PASS | All new logic on `users` + registry already owned by `account-data.service`. Cron route calls service only. No cross-service joins. |
| Auth boundary | PASS with conditions | Cron: bearer secret, fail closed. Admin actions: `requireAdmin` becomes DB-backed. Layouts + export check pending. Residual: other actions trust stale JWT up to 14 days (accepted debt D1). |
| Scalability | PASS | Batch 50 + 35 s start budget; sequential; index on `deletionRequestedAt`; admin list is already unpaginated (pre-existing, fine at current user counts). |
| Observability | PASS | `lib/utils/logger` (stderr JSON, not pino) with ids/counts only; cron summary logged; 500 on failure surfaces in Vercel logs. |
| GDPR | PASS | Column erased with user row; email carries user id only; DR 30-day wording in legal copy; no new PII stored. |

### Technology Decisions
None new. No new dependency. `Intl.DateTimeFormat` (built-in), `node:crypto`. Vercel Cron = platform feature (ADOPT).

### Verified mechanics (next-auth 4.24.15 source) and corrections to BA
- authorize throw: callback.js catch -> `redirect: ${url}/error?error=${encodeURIComponent(error.message)}`, status 401; react `signIn` (json:true) returns `error = new URL(data.url).searchParams.get('error')` (decoded). G5 mechanics CORRECT. Addendum: any unexpected throw's message also reaches the client; LoginForm must act only on exact `^DELETION_PENDING:\d{4}-\d{2}-\d{2}$` and otherwise show the generic message.
- OAuth `signIn` returning a string -> `redirect: <string>` emitted verbatim as Location (no encoding, no allow-list, no session). G6 CORRECT; build the string with URLSearchParams.
- `jwt` callback runs on every session read (session.js), so it must NOT query the DB (rejects the idea in item 5 of the brief).
- CORRECTION G15: "~45 s" time box + 15 s per-user tx timeout can exceed maxDuration 60. Stop starting users after 35 s.
- CORRECTION G7/G13/G16: a pending admin with a JWT on another device keeps `role=ADMIN` in `requireAdmin` and could cancel others' deletions / delete users. `requireAdmin` must be DB-backed (C9).
- CORRECTION G3/AC-05-9: `deleteAccountAction` must NOT use the live-session guard (a pending user re-submitting must get the original date); it keeps `getServerSession` + its own row read and relies on service idempotency.
- NOTE G12: `lib/utils/logger` is a small stderr-JSON wrapper, not pino. `notifications.ts` local `APP_URL` is `NEXTAUTH_URL`; `lib/legal/constants` also exports an `APP_URL` (production). Do not mix the two; use the notifications.ts one for the admin link.
- NOTE: sidebar `pendingCount` (`app/(app)/layout.tsx`) counts every `isActive:false` (includes rejected; pre-existing). Only add `deletionRequestedAt: null`; do not "fix" the rest.
- NOTE G18: header of sad-001 was stale (v1.5); bumped to v1.8.

### Architectural Decisions / BINDING CONSTRAINTS
C1 Schema + migration. `prisma/schema.prisma` User: `deletionRequestedAt DateTime?` (no @map; columns in this table are camelCase quoted) and `@@index([deletionRequestedAt])`. Migration dir `prisma/migrations/<ts>_add_deletion_requested_at/migration.sql`:
```sql
ALTER TABLE "users" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);
CREATE INDEX "users_deletionRequestedAt_idx" ON "users"("deletionRequestedAt");
```
Deploy: `prisma migrate deploy` BEFORE code (old code ignores the column). Rollback: code rollback is safe for schema, but pending users regain sign-in and purge stops; do not roll back while users are pending (or honour them manually). Dropping column/index only after confirming none pending.

C2 Service shape (`lib/services/account-data.service.ts`). One private routine runs the transaction (lock, effective-admin check, optional scheduled guard, registry erase loop, `user.delete`); do not duplicate the registry loop. Exports:
- `deleteUserAccount(userId, actorId): Promise<DeleteAccountResult>` signature unchanged.
- `purgeScheduledAccount(userId, cutoff: Date): Promise<{ ok: true } | { ok: false; reason: 'LAST_ADMIN' | 'NOT_FOUND' | 'NOT_DUE' }>`; actor logged as `'system:purge'`.
- `requestAccountDeletion(userId, now: Date): Promise<{ ok: true; requestedAt: Date; created: boolean } | { ok: false; reason: 'LAST_ADMIN' | 'NOT_FOUND' }>`.
- `cancelAccountDeletion(userId): Promise<boolean>` = `updateMany({ where: { id, deletionRequestedAt: { not: null } }, data: { deletionRequestedAt: null } })`, `count > 0`. No lock needed (cancel only increases the effective-admin set).
- `purgeDueAccounts({ batchSize, budgetMs }): Promise<{ purged; skipped; failed; remaining }>`.
Shared private lock helper (exact SQL; Prisma tagged template, `Prisma` param binding):
```sql
SELECT id, role::text AS role, "isActive", ("deletionRequestedAt" IS NOT NULL) AS "isPending"
FROM users
WHERE id = ${userId}
   OR (role = 'ADMIN' AND "isActive" = true AND "deletionRequestedAt" IS NULL)
ORDER BY id
FOR UPDATE
```
`ORDER BY id` is mandatory (deterministic lock order, avoids deadlocks). Do not return raw timestamps from `$queryRaw`. In JS: `targetIsEffectiveAdmin = target.role === 'ADMIN' && target.isActive && !target.isPending`; LAST_ADMIN iff `targetIsEffectiveAdmin && !rows.some(r => r.id !== userId)` (other rows are by construction effective admins). Pending target is never LAST_ADMIN.
- Request flow in one `$transaction` (`timeout: 15_000, maxWait: 5_000`): lock; no target -> NOT_FOUND; `target.isPending` -> read existing `deletionRequestedAt` via `tx.user.findUnique`, return `{ ok:true, requestedAt: existing, created:false }`; LAST_ADMIN check; `tx.user.update({ data: { deletionRequestedAt: now } })`; return `created:true`. Touches nothing else.
- Scheduled guard: after the lock and NOT_FOUND check, inside the same tx: `tx.user.findFirst({ where: { id: userId, deletionRequestedAt: { lte: cutoff } }, select: { id: true } })`; null -> `NOT_DUE` (covers cancelled and not yet due; `lte` excludes NULL). Then LAST_ADMIN check, then erase. `NOT_FOUND`/`NOT_DUE` count as `skipped`, `LAST_ADMIN` -> skipped + `logger.error({ userId }, ...)`, thrown error -> `failed` (log `{ userId, err: name }`).
- `purgeDueAccounts`: `cutoff = new Date(Date.now() - ACCOUNT_DELETION_GRACE_MS)`; candidates `prisma.user.findMany({ where: { deletionRequestedAt: { lte: cutoff } }, orderBy: { deletionRequestedAt: 'asc' }, take: batchSize, select: { id: true } })`; `total = prisma.user.count(same where)`; loop SEQUENTIALLY (no Promise.all), stop starting new users once `Date.now() - start >= budgetMs`; `remaining = total - purged - skipped - failed`. Cron passes `batchSize: 50, budgetMs: 35_000`.
- Keep audit log `logger.warn({ userId, actorId, counts }, 'account deleted')`; add `logger.warn({ userId, actorId }, 'account deletion requested' | 'cancelled')` at action level. IDs/counts only.
- Update the lock mocks in `account-data.service.test.ts`; add: pending admin purge OK; sole effective admin refused; A pending + B request refused; cancelled-before-lock NOT_DUE; two-user isolation.

C3 `lib/legal/deletion.ts` (new, pure, no Prisma/server imports): `ACCOUNT_DELETION_GRACE_DAYS = 14`; `ACCOUNT_DELETION_GRACE_MS`; `computePurgeAt(requestedAt: Date): Date` = first instant at 17:00:00.000 UTC that is >= `requestedAt + 14*24h` (if `requestedAt+14d` is exactly 17:00:00.000Z, that instant); `toBrisbaneIsoDate(d: Date): 'YYYY-MM-DD'` via `new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)` assembled manually (do not rely on a locale's default separator order); `formatDeletionDate(iso: string): string` -> "25 October 2026" by building `Date.UTC(y, m-1, d, 12)` and formatting with `timeZone: 'UTC'`, en-AU `{ day:'numeric', month:'long', year:'numeric' }` (no tz drift); `isValidIsoDate(s: string): boolean` = regex `^\d{4}-\d{2}-\d{2}$` AND round-trip through `Date.UTC` equals input (rejects 2026-13-45); `formatBrisbaneDateTime(d: Date): string` for the email. Tests per AC-LEG-05-16 plus invalid-date cases. Put `deletionRedirectQuery(date: string)` nowhere; build URLs with `new URLSearchParams`.

C4 Cron route `app/api/cron/purge-deleted-accounts/route.ts`: `export const dynamic = 'force-dynamic'; export const maxDuration = 60;` `GET` only. Auth helper `lib/auth/cron-auth.ts` `isAuthorizedCron(header: string | null, secret: string | undefined): boolean`: false if `!secret` or `!header`; compare `createHash('sha256').update(header).digest()` with `sha256('Bearer ' + secret)` using `crypto.timingSafeEqual` (equal-length digests, so no length branch leaks). Unset secret additionally logs `logger.error({}, 'CRON_SECRET not configured')`. Order: auth first (401, empty JSON `{ error: 'Unauthorized' }`), then `purgeDueAccounts`. Response `NextResponse.json(summary, { status: summary.failed === 0 ? 200 : 500 })`; unexpected exception -> 500 `{ error: 'Purge failed' }` + `logger.error`. No query params or body read. Do not add `/api/cron` to `proxy.ts` matcher and do not touch `proxy.ts`.
`vercel.json` (new, repo root), only:
```json
{ "crons": [{ "path": "/api/cron/purge-deleted-accounts", "schedule": "0 17 * * *" }] }
```
Assumptions (Vercel docs not available locally): GET with `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` env exists; UTC schedule; production only; Hobby = once/day with up to ~59 min slack (purge may run 03:00-03:59 AEST, never early because eligibility is `<= now - 14d`); no retry; no redirect following. `docs/provider-setup.md`: add CRON_SECRET (generate >= 32 random bytes, set in Vercel Production BEFORE deploy), Hobby caveat, preview deployments do not run cron.

C5 Auth callbacks (`lib/auth/auth.ts`), nothing else changes (no jwt/session callback change, no `types/next-auth.d.ts` change):
- `authorize`: after `verifyPassword` succeeds: `if (user.deletionRequestedAt) throw new Error(\`DELETION_PENDING:${toBrisbaneIsoDate(computePurgeAt(user.deletionRequestedAt))}\`)`. Order stays: missing/inactive/no hash/wrong password -> `null`. 
- `signIn` (OAuth branch): in the `else` (existing user) branch, BEFORE the profile-sync `update`: `if (dbUser.deletionRequestedAt) return \`/login?${new URLSearchParams({ error: 'AccountDeletionPending', deletionDate }).toString()}\``. New-user create branch untouched; `isActive` gate untouched.
- LoginForm: handle `result.error` only if `/^DELETION_PENDING:(\d{4}-\d{2}-\d{2})$/` matches AND `isValidIsoDate`; any other error text -> existing generic message. /login reads `error=AccountDeletionPending` + `deletionDate` and shows the message only when `isValidIsoDate(deletionDate)`; otherwise generic.

C6 Layout/route guards. `app/(app)/layout.tsx`: add `deletionRequestedAt: true` to the existing select; order: no session -> `/login`; no row -> `/login`; pending -> `redirect('/login?' + URLSearchParams{error:'AccountDeletionPending', deletionDate})`; consent -> `/accept-terms`. `pendingCount` query becomes `{ isActive: false, deletionRequestedAt: null }`. Same select/guard in `app/admin/layout.tsx` and `app/(consent)/accept-terms/page.tsx`. Do not add a second query. No change to `/login` redirect behaviour (it must not redirect authenticated users; ADR-008).

C7 `lib/actions/account.ts` `deleteAccountAction`: keep `getServerSession` and its own row read (do NOT use `getLiveSession`); after confirmation call `requestAccountDeletion(userId, new Date())`; map LAST_ADMIN/NOT_FOUND as today; compute `purgeDate = toBrisbaneIsoDate(computePurgeAt(requestedAt))`; if `created`, `await sendAccountDeletionRequestedEmail({ userId, requestedAt, purgeDate })` (never throws); return `ActionResult<{ purgeDate: string }>`; `logger.warn({ userId }, 'account deletion requested')`. Remove old `?accountDeleted=1` handling in `AccountDataSection.tsx` and `app/page.tsx`; replace per G8 with validated `deletionRequested` param.

C8 Email: `sendAccountDeletionRequestedEmail({ userId, requestedAt, purgeDate })` in `lib/email/notifications.ts`; `to: CONTACT_EMAIL` (import from `@/lib/legal/constants`); subject "MyWork: account deletion requested"; body: user id, `formatBrisbaneDateTime(requestedAt)`, `formatDeletionDate(purgeDate)`, link `${APP_URL}/admin/users` using the file-local `APP_URL`; no email/name/content. Whole body in try/catch; `!resend` -> `logger.warn({ userId }, ...)` and return; failure -> `logger.error({ userId }, ...)`. Never `console.error`, never log the recipient. Awaited after commit in the action (not `after()`, not inside the transaction). Existing send functions untouched.

C9 Live-session guard (decision on G7 residual). New `lib/auth/live-session.ts`: `getLiveSession(): Promise<{ userId: string; role: string; isActive: boolean } | null>` -> `getServerSession`, then `prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true, deletionRequestedAt: true } })`; null if no session, no row, or `deletionRequestedAt` set. Use ONLY in: `requireAdmin` in `lib/actions/admin.ts` (return id iff `live.role === 'ADMIN' && live.isActive`; role comes from DB, not JWT) and `GET /api/account/export` (null -> 401, preserving existing 401 body). Do NOT retrofit other actions/handlers (accepted debt D1, see below). Do NOT add DB reads to jwt/session callbacks.

C10 Admin actions (`lib/actions/admin.ts`). New `cancelUserDeletionAction(userId)`: `requireAdmin`; self-target blocked; `cancelAccountDeletion` false -> `'Deletion is not scheduled.'`; `logger.warn({ userId, actorId }, 'account deletion cancelled')`; `revalidatePath('/admin/users')`. G13: `setUserActiveAction`, `rejectUserAction`, `setUserRoleAction`, `setUserModulesAction`, `setUserEmploymentTypeAction` read `deletionRequestedAt` of the target first and return `'Cancel the deletion first.'` with no write and no email. `deleteUserAction` unchanged apart from the service's new effective-admin rule (this is "Delete now"). `app/admin/users/page.tsx`: select `deletionRequestedAt`; compute purge date server-side with the C3 helpers and pass strings to `UserTable`; derive status with precedence "Deletion pending"; the "N pending approval" count excludes pending-deletion users.

C11 Auth flows (`lib/actions/auth.ts`): `registerUser` unchanged (existing-email message already covers G9). `requestPasswordReset`: add `&& !user.deletionRequestedAt` to the existing condition (same success response). `resetPassword`: after the token is found valid, load the user's `deletionRequestedAt`; if set return the same "This password reset link is invalid or has expired." error and write nothing.

C12 Do NOT touch: `proxy.ts`, `types/next-auth.d.ts`, jwt/session callbacks, `account-data.registry.ts` (no new model), `lib/utils/logger.ts`, existing `send*` email functions, ADR-007 erase order, `LEGAL_VERSION` (G18 release check stays a release precondition). No new npm dependency. No Prisma middleware/`$extends`. No `tailwind.config.ts`.

C13 Tests (extend the ones touched): cron auth (missing/wrong/short/unset secret all 401, nothing erased), batch/time box with fake timers, purge idempotency, isolation, failure isolation (500 + others erased), `requireAdmin` DB-backed (stale ADMIN JWT with pending DB row -> Unauthorized), layout redirects, authorize throw string, signIn string redirect and that profile sync did not run, export 401 for pending.

### Debt (explicit)
- D1 Stale JWT accepted for all actions/handlers outside C9 (also pre-existing for deactivated users). Platform task: a shared guard or session-versioning.
- D2 `setUserRoleAction`/`setUserActiveAction` do not take the admin lock (ADR-007); G13 guards are read-then-write.
- D3 No alert on cron failure beyond Vercel logs; no retry (a failed user retries next day).
- D4 Pre-existing: OAuth link by unverified email; proxy matcher gap; sidebar pendingCount counts rejected users.
- D5 Hobby plan: Vercel Hobby is non-commercial; confirm plan suitability (operator concern, assumption noted).

### SAD Updates Made
- Added ADR-010; sad-001 header Version 1.8 / Date 2026-10-11 / BRD ref v1.7; change-log row 1.8; footer v1.8.

### ADRs Raised
- ADR-010: Grace-period account deletion, guarded scheduled purge and Vercel Cron — Accepted

### Next Stage Instructions
Developer: implement C1-C13 exactly; migration first and deployed first; set CRON_SECRET in Vercel Production before first deploy; run G18 release query. Use `ActionResult` convention already in `lib/actions/account.ts`. No application deviations without a new ADR.

---

## Stage Completed: developer — 2026-10-11

### Summary
Implemented the 14-day grace-period deletion per BA G1-G20 and SA C1-C13: nullable `User.deletionRequestedAt` + index (migration written offline, not applied), pure `lib/legal/deletion.ts`, service refactor around one private erase transaction (`deleteUserAccount`, `purgeScheduledAccount`, `requestAccountDeletion`, `cancelAccountDeletion`, `purgeDueAccounts`) with the exact C2 lock SQL, bearer-secret cron route + `vercel.json`, DB-backed `getLiveSession` (used only by `requireAdmin` and the export route), authorize/signIn changes, LoginForm dated messages, layout gates, operator email, admin cancel/delete-now UI and guards, password-reset guards, legal copy, BRD v1.7 and provider-setup updates. `npm run type-check`, `npm run lint` clean; `npx jest` full: 61 suites, 933 tests pass. Playwright not run.

### Artifacts Produced
Schema / migration
- prisma/schema.prisma — `deletionRequestedAt DateTime?` + `@@index([deletionRequestedAt])`.
- prisma/migrations/20261011010000_add_account_deletion_request/migration.sql — generated with `prisma migrate diff` (ADD COLUMN + CREATE INDEX); NOT applied. `prisma generate` run.

New
- lib/legal/deletion.ts (+ deletion.test.ts) — grace constants, computePurgeAt, toBrisbaneIsoDate, isValidIsoDate, formatDeletionDate, formatBrisbaneDateTime.
- lib/auth/cron-auth.ts (+ .test.ts) — isAuthorizedCron (SHA-256 + timingSafeEqual, fail closed).
- lib/auth/live-session.ts (+ .test.ts) — getLiveSession.
- lib/auth/auth.test.ts — authorize throw string, signIn redirect, no profile sync.
- app/api/cron/purge-deleted-accounts/route.ts (+ route.test.ts) — GET, force-dynamic, maxDuration 60, batch 50, budget 35s.
- vercel.json — crons only.
- app/page.test.tsx, app/(app)/profile/_components/AccountDataSection.test.tsx, app/admin/users/_components/UserTable.test.tsx.

Modified
- lib/services/account-data.service.ts (+ test) — refactor; lock SQL with ORDER BY id and isPending.
- lib/actions/account.ts (+ test) — requestAccountDeletion, returns { purgeDate }, email only when created, no live-session guard.
- lib/actions/admin.ts (+ test) — DB-backed requireAdmin, cancelUserDeletionAction, "Cancel the deletion first." guards (active/approve, reject, role, modules, employment).
- lib/actions/auth.ts (+ test) — requestPasswordReset / resetPassword pending guards.
- lib/auth/auth.ts — authorize throws DELETION_PENDING:date after correct password; OAuth signIn returns /login URL before profile sync.
- lib/email/notifications.ts (+ test) — sendAccountDeletionRequestedEmail.
- app/api/account/export/route.ts (+ test) — getLiveSession.
- app/(app)/layout.tsx, app/admin/layout.tsx, app/(consent)/accept-terms/page.tsx (+ their tests) — pending redirect; pendingCount excludes pending deletion.
- app/(auth)/login/_components/LoginForm.tsx (+ test) — dated message for exact code / validated URL params, else generic.
- app/(app)/profile/_components/AccountDataSection.tsx — new dialog copy, signOut to /?deletionRequested=date.
- app/page.tsx — `?accountDeleted=1` notice removed; validated `deletionRequested` status notice.
- app/admin/users/page.tsx, app/admin/users/_components/UserTable.tsx — Deletion pending status/badge/tab/actions.
- app/(public)/privacy, terms, data-deletion pages — grace-period copy (LEGAL_VERSION unchanged).
- e2e/legal-pages.spec.ts — /data-deletion "14 days" + cancel email smoke (not run).
- docs/brd/brd-001.md (v1.7), docs/provider-setup.md.

### Decisions Made / Deviations
- Migration directory is `20261011010000_add_account_deletion_request` (per the stage brief) rather than the C1 name `add_deletion_requested_at`. SQL is equivalent to C1 plus the generator's comment lines.
- G13 guard uses one helper (`isDeletionPending`, an extra `findUnique`) in all five actions including approve/reject, which already read the user; simpler, one extra read.
- LoginForm: an `error=AccountDeletionPending` URL with an invalid/missing date shows the existing generic "Invalid email or password" message (SA: "otherwise generic"). The form previously ignored all `?error=` params; other error values still show nothing.
- Admin "Delete now" confirmation uses the existing `window.confirm` pattern with distinct wording; pending rows show "Deletes <date>" under the badge. Cancel is blocked for self in `cancelUserDeletionAction` ("Cannot cancel your own deletion.").
- `/data-deletion` Facebook line: kept in the "Option 2" email paragraph (users who cannot or prefer not to sign in); no separate section.
- Legal copy states "14 days" as plain text (not from the constant); the constant is used in the profile dialog.
- New LoginForm/UserTable markup reuses existing styling; the pre-existing raw `red-*` classes in LoginForm's root error box were left untouched.
- `purgeDueAccounts` logs `LAST_ADMIN` via `logger.error({ userId })`; cron route logs the summary via `logger.info`.

### Known Issues / Deferred
- Playwright not run. Migration not applied (production DB). Tests mock Prisma; no real-DB test of the FOR UPDATE SQL or the cron end to end.
- Debt D1-D5 from SA unchanged (stale JWT accepted outside requireAdmin/export; no admin-lock in role/active actions; no cron-failure alert; Hobby non-commercial caveat).
- UserTable action icons are small (existing pattern), below the 44px mobile target; not changed.
- Release: run G18 query, set CRON_SECRET in Vercel Production, migrate before deploy.

### Next Stage Instructions
Run the tester agent on: lib/legal/deletion.ts, lib/services/account-data.service.ts, lib/auth/cron-auth.ts, lib/auth/live-session.ts, lib/auth/auth.ts, lib/actions/{account,admin,auth}.ts, app/api/cron/purge-deleted-accounts/route.ts, app/api/account/export/route.ts, layouts, UserTable, LoginForm.
Acceptance criteria to verify: AC-LEG-05-1..17, AC-LEG-07-1..14, AC-LEG-01-4/-5/-9/-10, AC-LEG-06-3 (see BA entry above). Priority: real-DB integration of lock SQL (two admins requesting concurrently, pending admin purge, cancel/purge race), cron auth, no-enumeration on register/reset, stale JWT redirects.

---

## Stage Completed: tester — 2026-10-11

### Test Results
| Check | Result |
|-------|--------|
| Jest (full) | PASS — 61 suites, 938 tests (933 existing + 5 added), 0 failing |
| type-check | PASS |
| lint | PASS |
| New dependencies (`git diff HEAD --stat -- package.json package-lock.json`) | None (empty) |
| Production code changes | None; no bugs found |
| Playwright / real DB | Not run (production DB safety) |

### Coverage (changed files; gates)
| File | Stmts | Branch | Gate |
|------|-------|--------|------|
| lib/services/account-data.service.ts | 100 | 98.27 | >=90 MET |
| lib/actions/account.ts | 100 | 90 | MET (global 80) |
| lib/actions/admin.ts | 100 | 100 | MET |
| lib/actions/auth.ts | 100 | 92.59 | MET |
| lib/legal/deletion.ts | 100 | 92.3 | MET |
| lib/auth/cron-auth.ts, live-session.ts | 100 | 100 | MET |
| lib/email/notifications.ts | 98.72 | 76.19 | MET |
| lib/schemas/** (unchanged) | 100 | 100 | >=95 MET |
| Global | 93.19 | 91.36 | >=80 MET |
lib/auth/auth.ts is outside the jest coverage collection; exercised by lib/auth/auth.test.ts (authorize + signIn paths).

### Tests added
- account-data.service.test.ts: exact C2 lock SQL (normalised, id bound once); purge cutoff = now - 14x24h with lte (20d/14d qualify, 13d23h does not) and batch `take`; NOT_FOUND counted skipped; job-level two-user isolation on every erase where clause.
- auth.test.ts: unknown-email OAuth creates an inactive user.
Existing tests already covered the remaining priority list (computePurgeAt boundaries/rollover, isValidIsoDate, idempotency, A-pending-then-B, NOT_DUE, time box, failure isolation, LAST_ADMIN skipped, cron 401/200/500, live-session, authorize/signIn, LoginForm, G13 guards, cancel action, reset/register, email, layouts, UserTable, landing notice, export 401).

### Failing Tests
None.

### Deferred (need real non-production DB / browser)
1. FOR UPDATE concurrency: two admins requesting deletion concurrently (exactly one succeeds); request vs. purge vs. cancel race. Run against a throwaway Postgres: `DATABASE_URL=<local> npx prisma migrate deploy` then a jest integration script.
2. Real purge: 0 rows remaining across the registry incl. soft-deleted rows; migration applies cleanly.
3. Cron in Vercel (Bearer CRON_SECRET injection, 03:00-03:59 AEST schedule, production only): verify on a staging project or call the route with curl against a local server with a local DB.
4. Playwright request -> blocked sign-in -> admin cancel -> sign-in flow; run `npx playwright test` with `.env.local` pointed at a local DB (never production).
5. axe-core and 375px checks on /, /login, profile dialog, /admin/users (Deletion pending tab). UserTable action icons are below the 44px target (developer noted).

### Next Stage Instructions
Run the tech-lead agent. Diff to review: `git diff main..HEAD` plus the uncommitted working tree. Release preconditions: G18 count query, CRON_SECRET in Vercel production, migrate before deploy.

---
## Stage Completed: tech-lead — 2026-10-11

### Verdict: APPROVE

Reviewed the uncommitted diff against SA C1-C13. All constraints met; no blocking issues; no escalation needed (no new model, dependency, middleware or RBAC deviation beyond what ADR-010 already approved).

### Constraint check
C1 met (schema.prisma, migration ADD COLUMN + index). C2 met (account-data.service.ts lockTargetAndAdmins: tagged `$queryRaw`, ORDER BY id FOR UPDATE, effective-admin predicate; cutoff guard inside same tx after lock; request idempotent; cancel via updateMany so a cancel racing a purge returns "not scheduled"). C3 met (lib/legal/deletion.ts). C4 met (auth first, SHA-256 + timingSafeEqual, fail closed, GET only, 401 body generic, 35s budget + 5s maxWait + 15s tx = 55s < 60). C5 met (authorize throws only after correct password; signIn builds URL via URLSearchParams before profile sync). C6 met (gate order no session, no row, pending, consent in all three guards; pendingCount excludes pending). C7 met (no live guard, email only when created). C8 met (id only; logger not console). C9 met (requireAdmin + export only). C10 met (all five mutation actions guarded; cancel self-blocked). C11 met. C12 met (proxy.ts, types, jwt/session, registry untouched; no package changes). C13 met per tester.

### Issues (blocking)
None.

### Suggestions (non-blocking)
- lib/schemas/account.schema.ts:5 — validation message still says "cannot be undone"; align with grace-period wording.
- app/(public)/terms/page.tsx:~79 — cancel mailto has no `subject=Cancel account deletion` (data-deletion and landing do); make consistent.
- Copy says "signed out straight away"; true for the current device only. Other devices keep a JWT up to 30 days (D1): they can still hit actions/handlers other than export/admin. Consider "cannot sign in again" wording until D1 is fixed, and have the lawyer check the "data kept unchanged" claim.
- LoginForm root error box keeps pre-existing raw red-* classes (not added here); migrate to destructive tokens when next touched.
- /help page does not exist in this repo; nothing to align.

### Technical Debt
- [TECH DEBT] D1: stale JWT accepted by all actions/handlers except requireAdmin and export (also affects deactivated users). Shared live guard or session versioning.
- [TECH DEBT] D2: role/active/modules/employment actions take no admin lock; G13 isDeletionPending is read-then-write.
- [TECH DEBT] D3: no alert on cron failure beyond Vercel logs; no retry until next day.
- [TECH DEBT] D4/D5: unverified-email OAuth linking (could reveal a deletion date to a spoofed identity); Hobby plan is non-commercial and cron fires anywhere within the 17:00 UTC hour.
- [TECH DEBT] Real-DB integration tests (FOR UPDATE concurrency, full purge, migration apply) and Playwright flows not run; lock SQL only asserted by string/mocks.
- [TECH DEBT] UserTable action icon buttons (incl. new Cancel deletion) are below the 44px mobile target; tracked pattern from before.
- [TECH DEBT] Operator email is a constant; if RESEND is unconfigured the operator is not notified (purge still runs).

### Next Stage Instructions
Run `/ship`. Release preconditions: G18 `SELECT count(*) FROM users WHERE "termsVersion"='2026-10-11'` (bump LEGAL_VERSION if >0); set CRON_SECRET in Vercel Production first; `prisma migrate deploy` both migrations before code; run one non-production end-to-end check of the lock SQL before relying on it.

---

## Stage Completed: developer (fix round) — 2026-10-11

## Summary
Applied two of the Tech Lead's optional suggestions: /terms §7 cancel mailto now carries the "Cancel account deletion" subject (matching /data-deletion and the landing notice); deleteAccountSchema acknowledgement message now reflects the 14-day grace period instead of "cannot be undone". Kept "signed out straight away" wording: layout gates redirect a pending user to /login on every device, so it is accurate for the UI; the D1 residual only affects crafted direct action calls.

## Artifacts Produced
- app/(public)/terms/page.tsx, lib/schemas/account.schema.ts

## Known Issues / Deferred
- Unchanged: D1–D5, real-DB/Playwright tests, UserTable icon touch targets.

## Next Stage Instructions
Pipeline complete. Release: G18 query, CRON_SECRET in Vercel Production, migrate deploy before code, /ship.

---

## Stage Completed: developer (scope change: manual purge) — 2026-10-11

### Summary
Owner decision implemented: no scheduled job. Admins permanently delete a pending account manually once its 14 days have passed; due accounts show as red rows. Overrides G4, G14, G15, C4, AC-LEG-07-1..10 and the cron parts of ADR-010. type-check, lint and full jest (59 suites, 917 tests) pass. Playwright not run; no DB writes.

### Files deleted
- app/api/cron/purge-deleted-accounts/ (route.ts, route.test.ts)
- lib/auth/cron-auth.ts, lib/auth/cron-auth.test.ts
- vercel.json (untracked, new in this change set; contained only `crons`)

### Files changed
- lib/legal/deletion.ts (+ test) — `computeDeletionDueAt` (request + 14x24h), `isDeletionDue`; 17:00 UTC alignment removed.
- lib/services/account-data.service.ts (+ test) — `purgeDueAccounts`, `PurgeSummary`, batch/time-box removed; `purgeScheduledAccount(userId, cutoff, actorId)`.
- lib/actions/admin.ts (+ test) — `deleteUserAction` uses `purgeScheduledAccount` for pending users, NOT_DUE message "This account can be deleted from <d MMMM yyyy>."
- app/admin/users/page.tsx, app/admin/users/_components/UserTable.tsx (+ test) — warning/red states, disabled Delete with aria-describedby, due-first sort, tab "(n · k due)", role="status" header line.
- lib/email/notifications.ts (+ test) — operator email wording.
- lib/auth/auth.ts, app/(app)/layout.tsx, app/admin/layout.tsx, app/(consent)/accept-terms/page.tsx, lib/actions/account.ts — rename to `computeDeletionDueAt` (+ tests updated for the new dates, 2026-10-25).
- Copy: app/(public)/{privacy,terms,data-deletion}/page.tsx, app/(app)/profile/_components/AccountDataSection.tsx (+ test), app/page.tsx, app/(auth)/login/_components/LoginForm.tsx (+ test), lib/schemas/account.schema.ts.
- e2e/legal-pages.spec.ts — asserts "14-day period".
- docs/brd/brd-001.md (v1.8, FR-LEG-07 rewritten, AC-UG-01-7, FR-LEG-05, AC-LEG-01-4/5/9, AC-LEG-06-3, change log), docs/sad/sad-001.md (v1.9, ADR-010 amendment + change log), docs/provider-setup.md (cron removed, operator procedure).

### Deviations / decisions
- `purgeScheduledAccount` gained a third `actorId` argument so the audit log records the admin instead of `system:purge`.
- ADR-010 original body still mentions cron/purgeDueAccounts as historical text; its status line and the Amendment mark those items superseded. These are the only remaining grep hits.
- Server-side `deletionDue` is computed at page render; UserTable props changed to `deletionRequestedAt` (ISO) + `deletionDue` (was `purgeDate`). Action result field `purgeDate` and the email param keep their names (value is now the due date).
- Rows: "Deletion requested" (warning) vs "Ready to delete" (bg-destructive badge, `bg-destructive/10 border-l-4 border-l-destructive` row). Delete button label is now "Delete" for all rows (was "Delete now"). Admin sidebar badge not changed (no suitable pattern).
- Pending users are sorted due-first/oldest-first only in the Deletion pending tab.
- LEGAL_VERSION unchanged. Existing migration unchanged.

### Known Issues / Deferred
- Real-DB/Playwright tests still not run. Timely deletion depends on the operator (documented).

---
