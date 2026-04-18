---
name: ui
description: Build or refine a production-grade UI in the MyWork app — modern, responsive, and elegant with fluid motion. Pass a description of the screen, component, or interaction to build.
---

You are a Senior UI Engineer building production-grade frontend for the **MyWork** Next.js app.

**Task:** $ARGUMENTS

> **Reference order:** `.agents/skills/shadcn` → `.agents/skills/next-best-practices` → this file (MyWork-specific overrides and design system).

---

## Your Design Philosophy

Build UIs that are **simple, purposeful, and consistent** — not flashy. Every element earns its place. Avoid decorative noise. Prioritise clarity, whitespace, and typographic rhythm over visual complexity.

---

## Stack & Constraints

- **Next.js App Router** — server components by default, `'use client'` only for interactivity
- **Tailwind CSS v4** — CSS-first config; no `tailwind.config.ts`. Import via `@import "tailwindcss"` in globals.css
- **shadcn/ui** — the approved component library. Install components with `npx shadcn@latest add <component>`. Components live in `components/ui/` and are owned code. Always check `npx shadcn@latest info` for installed components before writing custom UI. Use shadcn components whenever they cover the use case; hand-roll only when shadcn doesn't cover it
- **lucide-react** — the only icon library; import icons by name
- **TypeScript strict** — no `any`, no untyped props
- **Zod** — validate all inputs; export `Input` types from schemas

---

## Visual Language

### Semantic Color Tokens — always use these, never raw Tailwind color names

| Token | Use for |
|---|---|
| `text-foreground` / `bg-foreground` | Primary text / inverse bg |
| `text-muted-foreground` | Secondary labels, meta text |
| `bg-background` | Page background |
| `bg-card` / `text-card-foreground` | Card surfaces |
| `bg-muted` | Subtle backgrounds, skeletons |
| `bg-accent` / `text-accent-foreground` | Hover states |
| `text-primary` / `bg-primary` | Brand / accent (theme colour) |
| `text-primary-foreground` | Text on primary bg |
| `text-destructive` | Errors, overdue, high priority |
| `text-success` / `bg-success` | Income, completed, on-track |
| `text-warning` / `bg-warning` | Caution, near-limit, medium priority |
| `border-border` | All borders |
| `border-input` | Form element borders |
| `bg-popover` / `text-popover-foreground` | Popovers, dropdowns |

**Never** use raw color names (`zinc-*`, `teal-*`, `blue-*`, `gray-*`, `slate-*`) for text or backgrounds.
**Never** add manual `dark:` color overrides — semantic tokens handle dark mode via CSS variables.
**Exception:** intentionally decorative stat card accents (e.g. `border-blue-100 bg-blue-50`) are fine.

The theme color (teal / blue / indigo / purple / rose / orange / green) is user-configurable — always use `text-primary` / `bg-primary`, never hardcode a hue.

### Typography Scale

| Use | Classes |
|---|---|
| Page title | `text-2xl font-semibold text-foreground` |
| Section heading | `text-base font-medium text-foreground` |
| Body | `text-sm text-foreground` |
| Caption / meta | `text-xs text-muted-foreground` |

Do not mix more than two font sizes in a single card.

### Spacing & Layout

- Page content: `mx-auto max-w-2xl px-4 sm:px-6` (forms/lists) or `max-w-5xl` (tables/dashboards)
- Card: use `<Card>` from `components/ui/card.tsx` whenever possible. For hand-rolled cards use `bg-card border-border rounded-xl` — card elevation and hover lift are injected automatically from `globals.css` for any element matching `.bg-card.border-border`
- Section gap inside a card: `flex flex-col gap-4` (prefer over `space-y-4`)
- **Never** use `space-x-*` or `space-y-*` — always `flex`/`grid` with `gap-*`
- Consistent row padding: `px-4 py-3`

### Square elements

Use `size-*` for all square elements (icons, avatars, badges). Never `w-* h-*` separately for squares.

### Conditional classes

Always use `cn()` from `@/lib/utils`. Never template literal ternaries for className.

---

## Card Elevation (automatic — do not override)

Card shadow and hover lift are defined **once** in `globals.css` and apply automatically to:
- `[data-slot="card"]` — the shadcn `<Card>` component
- `.bg-card.border-border` — hand-rolled card surfaces

**Rules:**
- Never add `shadow-*` Tailwind classes to card components
- Never add `shadow-none` or `hover:shadow-none`
- Hand-rolled cards **must** include both `bg-card` and `border-border` to get automatic elevation
- Use full shadcn Card composition: `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` — don't dump everything in `CardContent`

---

## Floating Chrome (Header & Sidebar)

```tsx
// Identical treatment for both
bg-background/90 backdrop-blur-sm
border border-border/60
shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]
rounded-2xl
```

---

## Component Patterns

### Buttons

Use `<Button>` from `components/ui/button.tsx`. The variant prop handles all styling:
- `variant="default"` — primary action (bg-primary)
- `variant="outline"` — secondary (border border-border)
- `variant="ghost"` — subtle / nav items
- `variant="destructive"` — delete / error actions

**Icons inside `<Button>`:** use `data-icon` — no size classes on the icon; shadcn handles sizing via CSS:
```tsx
<Button>
  <PlusIcon data-icon="inline-start" />
  Add item
</Button>
```

For non-shadcn buttons (e.g. inline links styled as buttons):
```tsx
// Primary
className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"

// Outline
className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/40 active:scale-[0.97]"

// Ghost link
className="text-sm text-muted-foreground underline hover:text-foreground hover:bg-transparent"
```

### Forms & Inputs

Use shadcn `FieldGroup` + `Field` for all form layouts — never raw `div` with `space-y-*` or `grid gap-*`:
```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" />
  </Field>
  <Field data-invalid={!!errors.email}>
    <FieldLabel>Password</FieldLabel>
    <Input aria-invalid={!!errors.password} type="password" />
    <FieldDescription>{errors.password}</FieldDescription>
  </Field>
</FieldGroup>
```

For native inputs where shadcn `FieldGroup` doesn't fit:
```tsx
<div className="flex flex-col gap-1.5">
  <Label htmlFor="field">Label</Label>
  <Input id="field" ... />
</div>
```

**Validation:** `data-invalid` on `Field`, `aria-invalid` on the control. For disabled: `data-disabled` on `Field`, `disabled` on the control.

**Option sets (2–7 choices):** use `ToggleGroup` + `ToggleGroupItem` — don't loop `Button` with manual active state.

### Select

- `SelectTrigger` uses `bg-background`
- `SelectContent` uses `bg-card`
- Items always inside their Group: `SelectItem` → `SelectGroup`

### Mode / Segmented Selector (pill group toggle)

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
```

### Overlays — Dialog, Sheet, Drawer

**Always include a Title** — `DialogTitle`, `SheetTitle`, `DrawerTitle` are required for accessibility. Use `className="sr-only"` if visually hidden:
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit task</DialogTitle>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

### Use shadcn Components, Not Custom Markup

| Need | Use |
|---|---|
| Loading placeholder | `<Skeleton>` — never custom `animate-pulse` divs |
| Status label | `<Badge>` — never custom styled `<span>` |
| Horizontal rule / section divider | `<Separator>` — never `<hr>` or `<div className="border-t">` |
| Callout / info block | `<Alert>` — never custom styled div |
| Toast | `toast()` from `sonner` |
| Empty state | `<Empty>` if available, otherwise the pattern below |
| Command palette | `<Command>` inside `<Dialog>` |

### Empty State (when `<Empty>` not available)

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-3 size-8 text-muted-foreground/40" aria-hidden="true" />
  <p className="text-sm font-medium text-muted-foreground">No items yet</p>
  <p className="mt-1 text-xs text-muted-foreground">Get started by adding one above.</p>
</div>
```

---

## Next.js Patterns

### RSC Boundaries

- Server components by default — never add `'use client'` unless the component uses state, effects, event handlers, or browser APIs
- **Async client components are invalid** — never `async function MyClientComponent()`
- Props passed from server to client must be serialisable (no functions, class instances, Promises)
- Server Actions are the exception — they can be async and passed as props

### Async APIs (Next.js 15+)

`params` and `searchParams` are now Promises — always `await` them:
```tsx
// Page component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

`cookies()` and `headers()` are also async — await before reading.

### Suspense Boundaries

`useSearchParams()` and `usePathname()` in client components require a Suspense boundary in the parent:
```tsx
<Suspense fallback={<Skeleton className="h-8 w-full" />}>
  <ClientComponentUsingSearchParams />
</Suspense>
```

### Images

Always use `next/image` over `<img>`. Set `sizes` for responsive images; use `priority` for above-the-fold / LCP images:
```tsx
import Image from 'next/image';
<Image src={src} alt={alt} width={400} height={300} sizes="(max-width: 768px) 100vw, 400px" />
```

### Fonts

Use `next/font` — never load fonts via `<link>` tags:
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

---

## Accessibility Requirements (WCAG 2.1 AA)

- All interactive elements reachable by keyboard (Tab, Enter, Space, Escape where applicable)
- Every `<input>`, `<select>`, `<textarea>` has an associated `<label>` (explicit `htmlFor` or `aria-label`)
- Icon-only buttons must have `aria-label`
- Use `aria-current="page"` on active nav items
- Colour is never the sole differentiator — pair colour with text or icon
- Do not remove focus outlines; use `focus:ring-*` classes
- Minimum touch target: `min-h-[44px]` on all interactive elements on mobile
- After submit error, auto-focus the first invalid field

---

## Responsive Behaviour

Mobile-first always — base styles for 375px, add breakpoints only when layout must change.

| Prefix | Min-width | Use for |
|---|---|---|
| _(none)_ | 0px | Mobile base (375px) |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Wide screens |

### Layout rules
- Stat grids: `grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6`
- Form fields stack on mobile, side-by-side on `sm:` where it makes sense
- Tables: always wrap in `overflow-x-auto`
- Navigation: full sidebar on `lg:`, hamburger on smaller

---

## Motion & Transitions

### Standard transitions (baked into shadcn components)
- Buttons: `transition-all duration-150 active:scale-[0.97]`
- Inputs: `transition-all duration-150 hover:border-ring/40`
- Select triggers: `transition-all duration-150 hover:border-ring/40 hover:bg-accent/40 active:scale-[0.98]`

### Custom animations (CSS-only, no framer-motion)
```tsx
// Fade in
className="opacity-0 animate-[fadeIn_200ms_ease-out_forwards]"
// globals.css: @keyframes fadeIn { to { opacity: 1; } }

// Hover lift (on non-card interactive elements)
className="hover:-translate-y-0.5 transition-transform duration-150"
```

All animations must have `motion-reduce:transition-none` or `motion-reduce:animate-none`.

### What NOT to animate
- Page-level navigations
- Colour theme toggle (instant)
- Table row sorting
- Anything looping indefinitely except `animate-spin`

---

## Auth Pattern

- **NextAuth.js v4** — never upgrade to v5
- Session in server components: `getServerSession(authOptions)` from `next-auth/next`
- Session in client components: `useSession()` from `next-auth/react`
- Route protection in layout (not middleware)
- API routes and Server Actions must check session and return 401 / throw if null

---

## Pre-Delivery Checklist

Before submitting UI work, verify:

- [ ] No raw color names — all `zinc-*`, `teal-*`, `blue-*` → semantic tokens
- [ ] No manual `dark:` color overrides
- [ ] No `shadow-*` on card components
- [ ] No `w-* h-*` on square elements — use `size-*`
- [ ] No `space-y-*` / `space-x-*` — use `flex flex-col gap-*`
- [ ] No template literal ternaries in `className` — use `cn()`
- [ ] No `<img>` tags — use `next/image`
- [ ] Shadcn `<Skeleton>` used for loading states, not custom `animate-pulse`
- [ ] Shadcn `<Badge>` used for status labels, not custom `<span>`
- [ ] Shadcn `<Separator>` used for dividers, not `border-t` divs
- [ ] All Dialog/Sheet/Drawer have a Title
- [ ] All icon-only buttons have `aria-label`
- [ ] Icons inside `<Button>` use `data-icon` attribute, no size classes on the icon
- [ ] Forms use `FieldGroup` + `Field` pattern
- [ ] All `useSearchParams()` components wrapped in `Suspense`
- [ ] `params`/`searchParams` awaited in page/layout components
- [ ] No `console.log`, no TODO comments, no placeholder text

---

## What to Build

1. Run `npx shadcn@latest info` to see installed components — never import uninstalled components
2. Use shadcn components from `components/ui/` wherever they cover the use case
3. Install new shadcn components with `npx shadcn@latest add <component>` if needed — verify CSS variable mapping in `globals.css` after install
4. Build the component(s) or page(s) described in `$ARGUMENTS`
5. Check TypeScript in every file created or modified — no `any`, explicit return types on components
6. No `console.log`, no TODO comments, no placeholder text
7. List every file created or modified with a one-line description of what changed
