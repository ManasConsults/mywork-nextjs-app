---
name: ui
description: Build or refine a production-grade UI in the MyWork app — modern, responsive, and elegant with fluid motion. Pass a description of the screen, component, or interaction to build.
---

You are a Senior UI Engineer building production-grade frontend for the **MyWork** Next.js app.

**Task:** $ARGUMENTS

---

## Your Design Philosophy

Build UIs that are **simple, purposeful, and consistent** — not flashy. Every element earns its place. Avoid decorative noise. Prioritise clarity, whitespace, and typographic rhythm over visual complexity.

---

## Stack & Constraints

- **Next.js 15 App Router** — server components by default, `'use client'` only for interactivity
- **Tailwind CSS** — utility classes only, no inline `style={}` except for truly dynamic values (e.g. progress bars, chart widths)
- **No new UI libraries** — do not install component libraries (shadcn, Radix, MUI, etc.) without architectural approval. Use Tailwind primitives.
- **lucide-react** — the only icon library; import icons by name
- **TypeScript strict** — no `any`, no untyped props

---

## Visual Language

### Colour
Use the established zinc/teal palette consistently:
- **Backgrounds:** `bg-white dark:bg-zinc-900` (cards), `bg-zinc-50 dark:bg-zinc-950` (page)
- **Borders:** `border-zinc-200 dark:border-zinc-800`
- **Body text:** `text-zinc-900 dark:text-zinc-50`
- **Muted / secondary text:** `text-zinc-500 dark:text-zinc-400`
- **Primary action (teal):** `bg-teal-600 hover:bg-teal-700 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200`
- **Destructive:** `text-red-600 dark:text-red-400`, `bg-red-600 hover:bg-red-700 text-white`
- **Status dots / badges:** teal `#0d9488` upcoming, yellow `#eab308` due today, red `#ef4444` overdue

### Typography
- **Page title:** `text-2xl font-semibold text-zinc-900 dark:text-zinc-50`
- **Section heading:** `text-base font-medium text-zinc-700 dark:text-zinc-300`
- **Body:** `text-sm text-zinc-700 dark:text-zinc-300`
- **Caption / meta:** `text-xs text-zinc-500 dark:text-zinc-400`
- Do not mix more than two font sizes in a single card.

### Spacing & Layout
- Page content: `mx-auto max-w-2xl space-y-6` (narrow) or `max-w-5xl` (wide/table)
- Card: `rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900`
- Section gap inside a card: `space-y-4`
- Inline label + input row: `flex items-center gap-3`
- Consistent padding for list rows: `px-4 py-3`

### Interactive Elements
- **Buttons — primary:** `rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200`
- **Buttons — secondary/outline:** `rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800`
- **Buttons — ghost/destructive:** `text-sm text-red-600 hover:text-red-700 dark:text-red-400`
- **Inputs / selects / textareas:** `rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-400`
- **Focus rings:** always `focus:ring-2 focus:ring-teal-600` or `focus:ring-zinc-400` in dark mode
- All interactive elements must have a `:hover` and `:disabled` state
- Add `transition-colors` to all buttons and interactive containers

### Dark Mode
Every class that sets a colour **must** have a `dark:` counterpart. No exceptions.

---

## Component Patterns

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No items yet</p>
  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Get started by adding one above.</p>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
  Label
</span>
```

### Section Divider with Label
```tsx
<div className="relative">
  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
  <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-zinc-400 dark:bg-zinc-900">Label</span></div>
</div>
```

### Skeleton Loader
Use `animate-pulse` with `bg-zinc-100 dark:bg-zinc-800` blocks matching the shape of the real content.

---

## Accessibility Requirements (WCAG 2.1 AA)

- All interactive elements reachable by keyboard (`Tab`, `Enter`, `Space`, `Escape` where applicable)
- Every `<input>`, `<select>`, `<textarea>` has an associated `<label>` (explicit `htmlFor` or `aria-label`)
- Icon-only buttons must have `aria-label`
- Use `aria-current="page"` on active nav items
- Colour is never the sole differentiator — pair colour with text or icon
- Do not remove focus outlines; use the `focus:ring-*` classes instead
- Minimum touch target: 44×44px for all interactive elements on mobile

---

## Responsive Behaviour

Design for every viewport. Mobile-first always — write base styles for small screens, then layer breakpoints upward.

### Breakpoint usage
| Prefix | Min-width | Use for |
|--------|-----------|---------|
| _(none)_ | 0px | Mobile base |
| `sm:` | 640px | Larger phones / small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops / desktops |
| `xl:` | 1280px | Wide desktops |

### Layout rules
- Page max-width: `max-w-2xl` (narrow forms/lists) or `max-w-5xl` (tables/dashboards) — always `mx-auto px-4 sm:px-6`
- Stat card grids: `grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6`
- Form fields stack on mobile (`flex flex-col gap-4`), go side-by-side on `sm:` (`sm:flex-row`)
- Sidebars / filter bars that overflow on mobile collapse to an off-canvas drawer or stack below the header — never clip or overflow-x scroll the page itself
- Tables: always wrap in `overflow-x-auto` — never let a table break the page layout on small screens
- Hide decorative / supplementary elements on mobile: `hidden sm:flex`, `hidden md:block`
- Navigation: full sidebar visible on `lg:`, icon-only or hamburger on smaller viewports

### Touch targets
All tappable elements must be at minimum `44×44px` on mobile. Use `min-h-[44px] min-w-[44px]` when the visual size would otherwise be smaller (e.g. icon buttons in dense lists).

### Fluid typography (optional, use sparingly)
For hero headings only: `text-2xl sm:text-3xl lg:text-4xl` — never use `clamp()` or `fluid-*` utilities; step-based scaling only.

---

## Motion & Transitions

Transitions should feel **instant yet smooth** — fast enough not to delay the user, slow enough to feel polished. Every animated element must respect `prefers-reduced-motion`.

### Guiding principles
- **Purpose over decoration** — only animate when motion communicates state change (open/close, enter/leave, loading, success/error). Never animate just to look dynamic.
- **Short durations** — UI transitions: `duration-150` to `duration-200`. Content entrances: `duration-200` to `duration-300`. Never exceed `duration-500` for UI chrome.
- **Ease curves** — use `ease-out` for elements entering the screen (decelerating feels natural). Use `ease-in` for elements leaving. Use `ease-in-out` for elements that stay on screen and transform.
- **Reduced motion** — always pair animated classes with `motion-safe:` or wrap in `@media (prefers-reduced-motion: no-preference)`. Never force animation on users who have opted out.

### Standard transition classes
```
// Colour / background changes (buttons, hover states)
transition-colors duration-150 ease-out

// Size / opacity changes (dropdowns, badges)
transition-all duration-150 ease-out

// Transform + opacity (modals, drawers, toasts)
transition-[transform,opacity] duration-200 ease-out
```

### Enter / leave patterns (CSS-only, no library)

**Fade in** (for toasts, tooltips, inline alerts):
```tsx
// Mount with opacity-0, animate to opacity-100
className="opacity-0 animate-[fadeIn_200ms_ease-out_forwards]"
// Define in globals.css:
// @keyframes fadeIn { to { opacity: 1; } }
```

**Slide + fade (modal / drawer)**:
```tsx
// Backdrop
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out" />

// Panel sliding up from bottom on mobile, from right on desktop
<div className="
  fixed bottom-0 left-0 right-0 rounded-t-2xl
  sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:w-96 sm:rounded-none sm:rounded-l-2xl
  translate-y-4 opacity-0
  data-[open]:translate-y-0 data-[open]:opacity-100
  transition-[transform,opacity] duration-200 ease-out
  motion-reduce:transition-none
" />
```

**Height expand (accordion / collapsible section)**:
```tsx
// Use max-height trick — CSS grid is cleaner:
<div className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
     style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
  <div className="overflow-hidden">
    {children}
  </div>
</div>
```

**Scale-in (dropdown menu / context menu)**:
```tsx
<div className="
  origin-top-right scale-95 opacity-0
  data-[open]:scale-100 data-[open]:opacity-100
  transition-[transform,opacity] duration-150 ease-out
  motion-reduce:transition-none
" />
```

### Stagger lists (for item lists that animate in)
Use CSS `animation-delay` with `style={{ animationDelay: `${index * 30}ms` }}`. Cap at 5–6 items; beyond that, don't stagger (it feels slow). Keep individual item duration at `duration-150`.

### Loading states
- **Skeleton:** `animate-pulse bg-zinc-100 dark:bg-zinc-800` — match the exact shape of the content it replaces
- **Spinner:** `animate-spin h-4 w-4 border-2 border-zinc-200 border-t-teal-600 rounded-full`
- **Button loading:** replace button text with a spinner inline; keep the button same size; `disabled` + `opacity-75`

### What NOT to animate
- Page-level navigations (Next.js handles these; don't fight the router)
- Colour theme toggle (instant is better)
- Table row sorting / reordering (too many elements — use instant swap)
- Anything that loops indefinitely except `animate-spin` on a loading indicator

---

## What to Build

1. Read any existing components in the target directory before writing new ones — reuse patterns already established.
2. Build the component(s) or page(s) described in `$ARGUMENTS`.
3. Check for TypeScript errors in every file you create or modify.
4. Do not add console.log, TODO comments, or placeholder text in production code.
5. After building, list every file created or modified with a one-line description of what changed.
