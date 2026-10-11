# OAuth Provider Setup Checklist

Base URL: `https://mywork.manasconsults.net` (set `NEXTAUTH_URL` to this value in production).

> **Pre-launch notes**
> - The legal text (Privacy Policy, Terms of Use, data deletion page) is a draft pending review by an Australian lawyer. Items to raise: retention on account deletion (everything is erased), the 30-day response commitment, the limitation of liability wording, and the APP 8 overseas disclosure wording.
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
- [ ] Data deletion instructions URL: `https://mywork.manasconsults.net/data-deletion`
- [ ] Valid OAuth redirect URI: `https://mywork.manasconsults.net/api/auth/callback/facebook`
- [ ] Permissions: `public_profile`, `email`
- [ ] App mode: Live

## GitHub (Settings, Developer settings, OAuth Apps)

- [ ] Homepage URL: `https://mywork.manasconsults.net/`
- [ ] Authorization callback URL: `https://mywork.manasconsults.net/api/auth/callback/github`

## Environment

- [ ] `NEXTAUTH_URL=https://mywork.manasconsults.net`
- [ ] Apply migration `20261011000000_add_terms_consent` before deploying the code (additive, nullable columns).
