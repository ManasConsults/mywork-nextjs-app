# OAuth Provider Setup Checklist

Base URL: `https://mywork.manasconsults.net` (set `NEXTAUTH_URL` to this value in production).

> **Pre-launch notes**
> - The legal text (Privacy Policy, Terms of Use, data deletion page) is a draft pending review by an Australian lawyer. Items to raise: retention on account deletion (everything is erased after a 14-day grace period; disaster-recovery history can hold a copy for up to 30 days after that), the 30-day response commitment, the limitation of liability wording, and the APP 8 overseas disclosure wording.
> - `OPERATOR_ABN` in `lib/legal/constants.ts` (54 184 973 007) is the single source for every page that shows the ABN.
> - After any material change to the Terms or Privacy Policy, bump `LEGAL_VERSION` and `LEGAL_LAST_UPDATED` in `lib/legal/constants.ts` so every user is asked to accept again.

## Google (Google Cloud Console, OAuth consent screen)

- [ ] App home page: `https://mywork.manasconsults.net/`
- [ ] Privacy policy link: `https://mywork.manasconsults.net/privacy`
- [ ] Terms of service link: `https://mywork.manasconsults.net/terms`
- [ ] Authorised domain: `manasconsults.net`
- [ ] Authorised redirect URI: `https://mywork.manasconsults.net/api/auth/callback/google`
- [ ] Scopes: `openid`, `email`, `profile` only (non-sensitive, no verification beyond branding)
- [ ] Publishing status: In production

## Meta / Facebook (developers.facebook.com)

- [ ] App domains: `mywork.manasconsults.net`
- [ ] Privacy Policy URL: `https://mywork.manasconsults.net/privacy`
- [ ] Terms of Service URL: `https://mywork.manasconsults.net/terms`
- [ ] Data deletion instructions URL: `https://mywork.manasconsults.net/data-deletion` (instructions only: sign in, Profile, Account, Delete account; permanently deleted after a 14-day period, within 30 days after it ends; cancel by email; email route for users who cannot sign in)
- [ ] Valid OAuth redirect URI: `https://mywork.manasconsults.net/api/auth/callback/facebook`
- [ ] Permissions: `public_profile`, `email`
- [ ] App mode: Live

## GitHub (Settings, Developer settings, OAuth Apps)

- [ ] Homepage URL: `https://mywork.manasconsults.net/`
- [ ] Authorization callback URL: `https://mywork.manasconsults.net/api/auth/callback/github`

## Environment

- [ ] `NEXTAUTH_URL=https://mywork.manasconsults.net`
- [ ] Apply migrations `20261011000000_add_terms_consent` and `20261011010000_add_account_deletion_request` (`prisma migrate deploy`) BEFORE deploying the code. Both are additive (nullable columns, one index); old code ignores them.
- [ ] No scheduled job or extra secret is needed: permanent account deletion is manual (see below).

## Operator procedure: account deletion requests

Accounts are never deleted automatically. The Privacy Policy promises permanent deletion within 30 days after the 14-day grace period ends, so:

- [ ] Check Admin, Users, **Deletion pending** at least weekly. You are also emailed (subject "MyWork: account deletion requested") for each in-app request, with the date it can be deleted from.
- [ ] Rows highlighted red are past their 14 days ("Ready to delete"): select Delete and confirm. Delete is disabled until the due date and the server refuses earlier deletion.
- [ ] For a deletion request received by email (subject "Data deletion request"), verify the sender controls the account's email address before using Delete. Users who have not requested deletion in the app can be deleted immediately by an admin.
- [ ] For an emailed cancellation (subject "Cancel account deletion"), verify the sender the same way and select **Cancel deletion**; the user can then sign in again.
- [ ] Rolling back the code while users are pending deletion restores their sign-in. Do not roll back in that situation, or honour the pending requests manually.

## Release precondition (terms version)

Legal wording changed for the grace period but `LEGAL_VERSION` is intentionally not bumped, provided nobody has accepted the current version in production yet. Before release run:

```sql
SELECT count(*) FROM users WHERE "termsVersion" = '2026-10-11';
```

If the count is greater than 0, bump `LEGAL_VERSION` and `LEGAL_LAST_UPDATED` in `lib/legal/constants.ts` to the ship date so those users are asked to accept again.
