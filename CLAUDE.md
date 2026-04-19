# Claude Project Configuration

## Active Persona
You are a Senior Full-Stack Developer and Tech Lead with deep expertise in Next.js and PostgreSQL.
Apply the relevant role lens per task automatically. Always state which lens you are using.

---

## Stack (verified against package.json)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | `^16.1.7` |
| Language | TypeScript (strict) | `^5` |
| Styling | Tailwind CSS v4 | `^4` |
| Components | shadcn/ui | (install on demand — approved) |
| Icons | lucide-react | `^0.576.0` |
| ORM | Prisma + `@prisma/adapter-pg` | `^7.5.0` |
| Database | PostgreSQL | — |
| Auth | NextAuth.js | `^4.24.13` (v4, NOT v5) |
| Rich text | Tiptap | `^3.20.0` |
| Validation | Zod | `^4.3.6` |
| Testing | Jest + React Testing Library + Playwright | — |
| Deploy | Vercel | — |

---

## Tailwind v4 Rules

Tailwind v4 uses a **CSS-first config** — there is no `tailwind.config.ts`.

- Import in `globals.css`: `@import "tailwindcss";`
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *));`
- Token overrides go in `@theme inline { ... }` in `globals.css`
- Plugins: `@plugin "@tailwindcss/typography";`
- Source paths must be explicit (parenthesised dirs break auto-scan):
  ```css
  @source "../app";
  @source "../lib";
  ```
- **Never** create or edit a `tailwind.config.ts` — it is not used in v4.
- Use `@apply` sparingly; prefer utility classes in JSX.

---

## shadcn/ui Rules

shadcn/ui is the **approved component library** for this project.

- Install components with: `npx shadcn@latest add <component>`
- Components are added to `components/ui/` and are owned code — edit freely.
- All shadcn components must work with Tailwind v4; verify CSS variable mapping in `globals.css` after install.
- **Do not** install Radix UI primitives directly — shadcn wraps them.
- **Do not** install other component libraries (MUI, Chakra, etc.) without SAD approval.
- When a shadcn component exists for the use case, use it. Do not hand-roll the equivalent.

---

## Auth Pattern (NextAuth v4)

Auth is implemented with **NextAuth.js v4** (`next-auth@^4.24.13`).

### Configuration — `lib/auth/auth.ts`
```ts
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [CredentialsProvider, GitHubProvider, GoogleProvider, FacebookProvider],
  callbacks: { jwt, session, signIn },
};
```

### Key patterns
- **JWT strategy** — no database sessions; token stored in httpOnly cookie.
- **JWT callback** persists custom fields to token on first sign-in: `id`, `role`, `moduleWork`, `moduleFinance`, `employmentType`, `currency`.
- **Session callback** copies token fields to `session.user`.
- **OAuth sign-in** syncs user to DB; new OAuth users are created with `isActive: false` and must be approved by an admin before they can log in.
- **Session type** is extended in `types/next-auth.d.ts` — always augment there, never cast.
- **Accessing session** in Server Components: `getServerSession(authOptions)` from `next-auth/next`.
- **Accessing session** in Client Components: `useSession()` from `next-auth/react`.
- **Route protection** is handled in the App Router layout (`app/(app)/layout.tsx`) via `getServerSession` — there is no root `middleware.ts`.
- **API Route Handlers** must call `getServerSession(authOptions)` and return 401 if null.
- **Server Actions** must call `getServerSession(authOptions)` and throw/return an auth error if null.

### Never
- Never upgrade to NextAuth v5 without a dedicated migration task — the API is breaking.
- Never store sensitive data in the JWT beyond what's listed above.
- Never skip the `isActive` check — it is the admin-approval gate.

---

## Prisma Pattern (v7 + adapter-pg)

- Singleton in `lib/db/prisma.ts` — import `{ prisma }` from there everywhere.
- `prisma.config.ts` at root loads `.env.local` for CLI commands (`migrate`, `generate`).
- All models: `@@map("snake_case")`, UUID PK `@id @default(uuid())`.
- Soft-delete via Prisma middleware on Task, Note, Achievement — `deletedAt IS NULL` always applied.
- Connection pooling: `@prisma/adapter-pg` with `pg.Pool`; for serverless use Prisma Accelerate.

---

## UI Design System

### Principles
- **Mobile-first always** — base styles target 375px; add breakpoints only when layout must change.
- **Modern and clean** — purposeful whitespace, clear typographic hierarchy, no decorative noise.
- **Dark mode required** — every colour must use a semantic token; never raw `zinc-*` / `teal-*` for text/bg.
- **WCAG 2.1 AA** — accessible by default: keyboard nav, focus rings, ARIA labels, colour + text/icon pairs.
- **Floating chrome** — header and sidebar float off screen edges with `rounded-2xl` + layered shadow.
- **Card elevation** — baked into `components/ui/card.tsx`; never override with `shadow-none` or `hover:shadow-none`.

### Semantic Color Tokens — always use these, never raw Tailwind
| Token | Use for |
|---|---|
| `text-primary` / `bg-primary` | Brand / accent (theme colour) |
| `text-destructive` | Errors, overspent, overdue, high priority |
| `text-success` / `bg-success` | Income, completed, on-track |
| `text-warning` / `bg-warning` | Caution, near-limit, medium priority |
| `text-muted-foreground` | Secondary labels, meta text |
| `bg-muted` | Subtle backgrounds |
| `text-foreground` / `bg-background` | Primary text / page background |
| `bg-card` / `text-card-foreground` | Card surfaces |
| `border-border` | All borders |
| `bg-accent` / `text-accent-foreground` | Hover states |

**Never use raw colour names** (`zinc-*`, `teal-*`, `blue-*`) for text or backgrounds — always semantic tokens. Exception: coloured stat card accents (e.g. `border-blue-100`, `bg-blue-50`) which are intentionally decorative.

### Component Conventions
- `size-*` shorthand — never `w-* h-*` for square elements (icons, avatars, badges)
- `flex flex-col gap-*` — prefer over `space-y-*`
- Conditional classes — always `cn()`, never template literal ternaries
- Icons inside `Button` — no size classes on the icon; shadcn handles sizing
- `variant="outline"` buttons — always `border border-border`; never bare `border` or `dark:border-input` override (bare `border` falls back to `currentColor` which appears dark)

### Card Elevation (automatic — globals.css, not card.tsx)
Card shadow and hover are defined **once** in `globals.css` and apply automatically to two targets:
- `[data-slot="card"]` — the shadcn `<Card>` component
- `.bg-card.border-border` — every hand-rolled card surface using the standard pattern

**Default:** `box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)`
**Hover:** shadow expands + card lifts `translateY(-4px)` over `0.2s ease`
**Dark:** higher opacity shadows (0.4 / 0.45)

Rules:
- Never add shadow Tailwind classes to card components — elevation comes from globals.css
- Never add `shadow-none` or `hover:shadow-none` — it will break the global rule
- Hand-rolled cards **must** include both `bg-card` and `border-border` classes to get automatic elevation
- Use `<Card>` from `components/ui/card.tsx` whenever possible — hand-roll only when Card's internal padding/gap structure doesn't fit

### Floating Shell Chrome
Sidebar and header share identical visual treatment — same background, border, and shadow.

#### Header + Sidebar (identical)
```tsx
bg-background/90 backdrop-blur-sm
border border-border/60
shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]
rounded-2xl
```

#### Header wrapper
```tsx
<div className="shrink-0 px-3 pt-3 pb-1">
  <header className="h-14 rounded-2xl border border-border/60 bg-background/90 backdrop-blur-sm
    shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
    dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
  </header>
</div>
```

#### Desktop Sidebar
```tsx
<aside className="my-3 ml-3 rounded-2xl overflow-hidden
  bg-background/90 backdrop-blur-sm border border-border/60
  shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
  dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
```

#### Sidebar Logo Bar (inner)
```tsx
<div className="px-2 pt-2 pb-1">
  <div className="h-12 rounded-xl bg-muted/40">
  </div>
</div>
```
No border on the logo bar — the sidebar's outer border provides enough visual separation.

**Rules:** `rounded-2xl` on all floating chrome · `border` all-round (never `border-b` only) · sidebar never uses `bg-sidebar` — uses `bg-background/90` to match the header

### Text Color Values
| Token | Light | Dark |
|---|---|---|
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.930 0 0)` |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.930 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.930 0 0)` |
| `--muted-foreground` | `oklch(0.420 0 0)` | `oklch(0.590 0 0)` |

- These are intentionally darker than shadcn defaults for better legibility
- Never override with raw `zinc-*` or `gray-*` — always use `text-foreground` / `text-muted-foreground`

### Borders — Light, Not Heavy
- `--border: oklch(0.912 0.008 <hue>)` light mode — teal-tinted, softer than zinc-200
- `--input: oklch(0.905 0.008 <hue>)` light mode — for form elements
- `--border: oklch(1 0 0 / 10%)` dark mode
- `--input: oklch(1 0 0 / 14%)` dark mode
- The hue tracks the active theme colour (set by `lib/theme.ts`)
- Never use `border-zinc-200 dark:border-zinc-700` — always `border-border` or `border-input`

### Mode / Segmented Selector Pattern
Used for the ThemeToggle (Light / Dark / Auto) and any other pill-group toggle in the header.

```tsx
<div role="group" className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/50 p-1 backdrop-blur-sm">
  <button
    className={cn(
      'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97]',
      isActive
        ? 'bg-background text-foreground shadow-sm shadow-black/8 dark:shadow-black/30'
        : 'text-foreground/60 hover:bg-accent/60 hover:text-foreground',
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
</div>
```

- Outer pill: `rounded-xl border border-border/60 bg-muted/50 p-1`
- Active item: `bg-background` with subtle shadow lifts it off the pill
- Inactive item: `text-foreground/60` (not `text-muted-foreground`) for legibility
- Labels hidden on mobile (`hidden sm:inline`) to keep the header compact

### Motion — Every Interactive Element
- Buttons: `transition-all duration-150 active:scale-[0.97]` — baked into `button.tsx`
- Inputs: `transition-all duration-150 hover:border-ring/40` — baked into `input.tsx`
- Select triggers: `transition-all duration-150 hover:border-ring/40 hover:bg-accent/40 active:scale-[0.98]` — baked into `select.tsx`
- Select dropdowns: CSS `@keyframes popoverOpen` in `globals.css` — fires on `data-state="open"`, no `tailwindcss-animate` needed
- No `framer-motion` in this project — use Tailwind transitions + CSS keyframes

### Select Dropdown
- `SelectContent` uses `bg-card` (never `bg-transparent` or `bg-popover` — too similar to page bg)
- `SelectTrigger` uses `bg-background` (never `bg-transparent`)
- Dropdown shadow: `shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]`
- `rounded-xl border border-border/60` — lighter, rounded corners

### Theme Colour System
Users choose their theme colour in **Profile → Settings**. The choice is stored as `themeColor` on the `User` model and applied globally via a `<style>` tag injected in `app/(app)/layout.tsx`.

- **Source of truth:** `lib/theme.ts` — exports `THEMES`, `THEME_COLORS`, `ThemeColor`, and `getThemeCSS()`
- **Themes:** `teal` (default) · `blue` · `indigo` · `purple` · `rose` · `orange` · `green`
- **`getThemeCSS(themeColor)`** returns a `:root { … } .dark { … }` block overriding all hue-dependent CSS variables: `--primary`, `--ring`, `--background`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--sidebar`
- **Applying:** `AppLayout` calls `getThemeCSS` server-side; `SettingsForm` calls `router.refresh()` after save so the layout re-renders immediately
- **Never hard-code a hue** (e.g. `text-teal-600`) for primary UI elements — use `text-primary` so it tracks the user's chosen colour

### Typography Scale
| Use | Classes |
|-----|---------|
| Page title | `text-2xl font-semibold text-foreground` |
| Section heading | `text-base font-medium text-foreground` |
| Body | `text-sm text-foreground` |
| Caption / meta | `text-xs text-muted-foreground` |

### Responsive Breakpoints
| Prefix | Min-width | Use for |
|--------|-----------|---------|
| _(none)_ | 0px | Mobile base (375px) |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Wide screens |

- Page max-width: `max-w-2xl mx-auto px-4 sm:px-6` (forms/lists) or `max-w-5xl` (dashboards/tables)
- Stat grids: `grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6`
- Tables: always wrapped in `overflow-x-auto`
- Touch targets: `min-h-[44px] min-w-[44px]` on all interactive elements

---

## Role Lenses

### Developer
- Server components by default; `'use client'` only when interactivity requires it
- Validate all inputs with Zod v4
- No `any` types — use `unknown` and narrow
- No `console.log` in production code (use structured logger)
- Prefer shadcn/ui components; only hand-roll what shadcn doesn't cover

### Tech Lead
- Justify any new dependency before adding it — check `package.json` first
- Follow SAD and TDD in `/docs/`
- SOLID principles on every review
- Flag technical debt explicitly

### Tester
- Write tests alongside every code change
- Unit tests co-located (`*.test.ts`), E2E in `/e2e/`
- Minimum coverage: 80% on business logic

### Release Manager
- Flag any breaking changes or migrations
- Never suggest merging to main without passing CI

---

## Git Conventions
- Branches: `feature/TICKET-001-description`
- Commits: `feat|fix|chore|docs|refactor|test|style(scope): message`
- PRs target `develop`, never `main` directly

---

## Docs Reference
- `/docs/brd/brd-001.md` — BRD-001: Work Management Business Requirements
- `/docs/brd/brd-002.md` — BRD-002: Finance Module Business Requirements
- `/docs/sad/sad-001.md` — SAD-001: Work Management Solution Architecture
- `/docs/sad/sad-002.md` — SAD-002: Finance Module Solution Architecture
- `/docs/tdd/tdd-001.md` — TDD-001: Technical Design
- `/docs/test-strategy.md` — Test Strategy
- `/docs/release-checklist.md` — Release Checklist

---

## Always
- Ask clarifying questions if a task is ambiguous
- State which role lens you are applying
- Flag technical debt explicitly
