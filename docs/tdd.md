# Technical Design Document (TDD)

## Work Management Application — *MyWork*

| Field         | Value                                       |
|---------------|---------------------------------------------|
| Document ID   | TDD-001                                     |
| Version       | 1.2                                         |
| Status        | Active                                      |
| Author        | Engineering Team                            |
| Date          | 2026-03-05                                  |
| Related Docs  | BRD-001 v1.1, SAD-001 v1.1                  |
| Reviewers     | Tech Lead, Senior Engineers, QA Lead        |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Folder Structure](#2-folder-structure)
3. [Coding Standards](#3-coding-standards)
4. [Component Architecture Patterns](#4-component-architecture-patterns)
5. [API Design](#5-api-design)
6. [State Management Strategy](#6-state-management-strategy)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [Logging Strategy](#8-logging-strategy)
9. [Testing Approach](#9-testing-approach)
10. [Configuration & Environment](#10-configuration--environment)
11. [Database Conventions](#11-database-conventions)
12. [Git & CI/CD Conventions](#12-git--cicd-conventions)

---

## 1. Introduction

### 1.1 Purpose

This TDD establishes the concrete engineering standards, patterns, and conventions that all contributors must follow when building *MyWork*. While the SAD (SAD-001) defines *what* is built and *why*, this document defines *how* it is built — the day-to-day decisions that keep the codebase consistent, testable, and maintainable.

### 1.2 Guiding Maxims

- **Server by default.** If a component can be a Server Component, it must be.
- **Validate at the boundary.** Every unit of external input is parsed by a Zod schema before it touches business logic.
- **Types, not comments.** The type system is the primary documentation. Comments explain *why*, not *what*.
- **Co-locate what changes together.** Tests, schemas, and types live next to the code they describe.
- **Fail loudly in dev, fail gracefully in prod.**

---

## 2. Folder Structure

### 2.1 Root Layout

```
mywork-nextjs-app/
├── app/                        # Next.js App Router (pages, layouts, API routes)
├── components/                 # Shared, reusable UI components
├── lib/                        # Pure business logic, utilities, infrastructure clients
├── prisma/                     # Prisma schema, migrations, seed
├── e2e/                        # Playwright end-to-end tests
├── public/                     # Static assets (fonts, icons, images)
├── docs/                       # BRD, SAD, TDD
├── .github/                    # GitHub Actions CI/CD workflows
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
├── playwright.config.ts
└── .env.local                  # Never committed; see .env.example
```

### 2.2 `app/` — Next.js App Router

```
app/
├── (auth)/                          # Route group: public, no session required
│   ├── login/
│   │   ├── page.tsx                 # RSC shell
│   │   └── _components/
│   │       └── LoginForm.tsx        # 'use client' — form interactivity
│   └── forgot-password/
│       ├── page.tsx
│       └── _components/
│           └── ForgotPasswordForm.tsx
│
├── (app)/                           # Route group: requires valid session
│   ├── layout.tsx                   # AppLayout RSC: session guard → <AppShell>
│   ├── _components/
│   │   ├── AppShell.tsx             # 'use client': mobileOpen state, hamburger, ThemeToggle
│   │   └── Sidebar.tsx              # 'use client': desktop collapse + mobile drawer
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── tasks/
│   │   ├── page.tsx                 # RSC: fetches + renders TaskList
│   │   ├── [id]/
│   │   │   ├── page.tsx             # RSC: task detail view
│   │   │   └── loading.tsx          # Streaming skeleton
│   │   ├── loading.tsx
│   │   ├── error.tsx                # 'use client' error boundary
│   │   └── _components/
│   │       ├── TaskList.tsx         # RSC: renders list of TaskCard
│   │       ├── TaskCard.tsx         # RSC: single task display
│   │       ├── TaskFilters.tsx      # 'use client': URL state filter controls
│   │       ├── TaskForm.tsx         # 'use client': create/edit form
│   │       └── TaskStatusBadge.tsx  # RSC: purely visual, no interactivity
│   │
│   ├── work-logs/
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── WorkLogList.tsx
│   │       └── WorkLogForm.tsx
│   │
│   ├── achievements/
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── AchievementList.tsx
│   │       ├── AchievementForm.tsx
│   │       └── AchievementExportButton.tsx  # 'use client'
│   │
│   ├── notes/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── NoteList.tsx
│   │       └── NoteEditor.tsx       # 'use client': Tiptap rich text editor
│   │
│   ├── todos/
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── TodoList.tsx         # 'use client': drag-and-drop, optimistic updates
│   │       ├── TodoItem.tsx         # 'use client'
│   │       ├── QuickAddTodo.tsx     # 'use client'
│   │       └── CarryOverPrompt.tsx  # 'use client'
│   │
│   └── search/
│       ├── page.tsx                 # RSC: renders search results from ?q= param
│       └── _components/
│           └── SearchResults.tsx
│
├── admin/                           # Admin-only routes (not a route group — maps to /admin)
│   ├── layout.tsx                   # AdminLayout: session + ADMIN role guard + nav
│   ├── page.tsx                     # Redirects to /admin/users
│   └── users/
│       ├── page.tsx
│       └── _components/
│           └── UserTable.tsx        # Filter tabs, role select, activate/deactivate
│
├── api/                             # Route Handlers
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   ├── tasks/
│   │   ├── route.ts                 # GET /api/tasks, POST /api/tasks
│   │   └── [id]/
│   │       └── route.ts             # GET, PATCH, DELETE /api/tasks/:id
│   ├── work-logs/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── achievements/
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── [id]/export/route.ts
│   ├── notes/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── todos/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── search/
│   │   └── route.ts
│   └── admin/
│       ├── users/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── groups/
│           ├── route.ts
│           └── [id]/route.ts
│
├── error.tsx                        # Global unhandled error boundary
├── not-found.tsx                    # 404 page
├── layout.tsx                       # Root layout: html, body, providers
└── middleware.ts                    # Edge: auth guard, rate limit, security headers
```

### 2.3 `components/` — Shared UI

```
components/
├── ui/                              # Primitive, headless-styled components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Dialog.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Skeleton.tsx
│   └── Toast.tsx
├── layout/                          # Structural layout components
│   ├── AppShell.tsx                 # Client shell: mobile hamburger + mobileOpen state
│   ├── Sidebar.tsx                  # Desktop collapse + mobile drawer variant
│   ├── Topbar.tsx
│   └── PageHeader.tsx
├── search/                          # Global CmdK search palette
│   ├── CmdK.tsx                     # 'use client'
│   └── SearchResult.tsx
└── providers/                       # Client-only context providers
    ├── ToastProvider.tsx
    └── ThemeProvider.tsx
```

### 2.4 `lib/` — Business Logic & Infrastructure

```
lib/
├── auth/
│   ├── auth.ts                      # NextAuth config export
│   ├── rbac.ts                      # requireRole(), getSession() helpers
│   └── passwords.ts                 # hashPassword(), verifyPassword()
│
├── db/
│   └── prisma.ts                    # Prisma singleton + soft-delete middleware
│
├── services/                        # Domain service functions (pure, testable)
│   ├── tasks.ts                     # createTask(), updateTask(), archiveTask()...
│   ├── work-logs.ts
│   ├── achievements.ts
│   ├── notes.ts
│   ├── todos.ts
│   ├── search.ts                    # runGlobalSearch()
│   └── admin/
│       ├── users.ts
│       └── groups.ts
│
├── actions/                         # Server Actions (thin wrappers over services)
│   ├── tasks.ts
│   ├── work-logs.ts
│   ├── achievements.ts
│   ├── notes.ts
│   └── todos.ts
│
├── schemas/                         # Zod schemas (shared between actions + route handlers)
│   ├── task.schema.ts
│   ├── work-log.schema.ts
│   ├── achievement.schema.ts
│   ├── note.schema.ts
│   ├── todo.schema.ts
│   ├── search.schema.ts
│   └── admin/
│       ├── user.schema.ts
│       └── group.schema.ts
│
├── email/
│   ├── resend.ts                    # Resend client singleton
│   └── notifications.ts             # sendRegistrationPendingEmail(), sendAccountApprovedEmail(), sendAccountRejectedEmail()
│
├── logger.ts                        # pino logger singleton
├── errors.ts                        # AppError, ForbiddenError, NotFoundError classes
└── utils/
    ├── dates.ts                     # Date formatting helpers
    ├── pagination.ts                # Cursor pagination helpers
    └── strings.ts                   # Truncate, slugify, etc.
```

### 2.5 `prisma/`

```
prisma/
├── schema.prisma                    # Single source of truth for DB schema
├── migrations/                      # Auto-generated versioned migration files
│   └── 20260224000000_init/
│       └── migration.sql
└── seed.ts                          # Dev seed: admin user + sample data
```

### 2.6 `e2e/` — Playwright

```
e2e/
├── fixtures/
│   └── auth.fixture.ts              # Shared login fixture
├── pages/                           # Page Object Models
│   ├── TasksPage.ts
│   ├── TodoPage.ts
│   └── SearchPage.ts
├── specs/
│   ├── auth.spec.ts
│   ├── tasks.spec.ts
│   ├── todos.spec.ts
│   ├── search.spec.ts
│   └── a11y/
│       └── wcag.spec.ts
└── helpers/
    └── db.ts                        # E2E DB seeding/teardown helpers
```

---

## 3. Coding Standards

### 3.1 TypeScript Configuration

`tsconfig.json` enforces strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Rules that follow:**
- `any` is **banned**. Use `unknown` and narrow with type guards.
- All exported functions must have explicit return type annotations.
- Prefer `interface` for object shapes, `type` for unions and mapped types.
- Avoid non-null assertion (`!`) except where TypeScript genuinely cannot infer (document why with a comment).

### 3.2 Naming Conventions

| Item                        | Convention          | Example                              |
|-----------------------------|---------------------|--------------------------------------|
| React components            | PascalCase          | `TaskCard.tsx`, `WorkLogForm`        |
| Component props interface   | `ComponentNameProps` | `TaskCardProps`                     |
| Hooks                       | `useCamelCase`      | `useTaskFilters`, `useCarryOver`     |
| Server Actions              | `verbNoun`          | `createTask`, `archiveNote`          |
| Service functions           | `verbNoun`          | `getTaskById`, `updateWorkLog`       |
| Route Handler files         | `route.ts`          | `app/api/tasks/[id]/route.ts`        |
| Zod schemas                 | `nounSchema`        | `taskSchema`, `createTaskSchema`     |
| TypeScript types from Zod   | `NounInput`         | `CreateTaskInput`, `UpdateNoteInput` |
| Constants                   | `SCREAMING_SNAKE`   | `MAX_NOTE_LENGTH`, `SESSION_EXPIRY`  |
| Enum values (Prisma)        | `SCREAMING_SNAKE`   | `IN_PROGRESS`, `CRITICAL`            |
| Non-public module files     | `kebab-case`        | `task-filters.ts`, `date-utils.ts`   |

### 3.3 File Naming Rules

| Type                     | Convention      | Notes                                             |
|--------------------------|-----------------|---------------------------------------------------|
| React components         | `PascalCase.tsx` | One component per file; file name = component name |
| Server Actions file      | `camelCase.ts`  | Named `actions/tasks.ts`, not `taskActions.ts`    |
| Route Handlers           | `route.ts`      | Fixed by Next.js convention                       |
| Zod schemas              | `noun.schema.ts`| e.g., `task.schema.ts`                            |
| Test files               | `*.test.ts(x)`  | Co-located with the file under test               |
| E2E specs                | `*.spec.ts`     | Under `/e2e/specs/`                               |
| Page Object Models       | `NounPage.ts`   | e.g., `TasksPage.ts`                              |

### 3.4 Import Ordering

ESLint `import/order` enforces this sequence. Developers should follow it manually too:

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. External packages
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';

// 3. Internal absolute imports (alias @/)
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { taskSchema } from '@/lib/schemas/task.schema';

// 4. Relative imports
import { TaskCard } from './_components/TaskCard';

// 5. Type-only imports (always last)
import type { Task } from '@prisma/client';
import type { CreateTaskInput } from '@/lib/schemas/task.schema';
```

### 3.5 No `console.log` in Production

Use the logger (§8) everywhere:

```typescript
// ❌ Banned
console.log('Task created:', task);
console.error('Something went wrong:', err);

// ✅ Correct
import { logger } from '@/lib/logger';
logger.info({ taskId: task.id }, 'Task created');
logger.error({ err }, 'Failed to create task');
```

ESLint rule `no-console` is set to `error` in CI. The rule is set to `warn` locally to not interrupt flow during development.

### 3.6 TypeScript Patterns

#### Narrowing unknown

```typescript
// ❌
function handleError(err: any) {
  logger.error(err.message);
}

// ✅
function handleError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ err }, message);
}
```

#### No implicit `any` in generics

```typescript
// ❌
async function fetchData<T>(url: string): Promise<T> { ... }

// ✅ — constrain or document the generic
async function fetchData<T extends Record<string, unknown>>(url: string): Promise<T> { ... }
```

#### Exhaustive switch

```typescript
function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'BACKLOG':      return 'Backlog';
    case 'IN_PROGRESS':  return 'In Progress';
    case 'BLOCKED':      return 'Blocked';
    case 'IN_REVIEW':    return 'In Review';
    case 'DONE':         return 'Done';
    case 'ARCHIVED':     return 'Archived';
    default: {
      // Compile-time exhaustiveness check
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
    }
  }
}
```

### 3.7 ESLint & Prettier

`.eslintrc.json` (key rules beyond Next.js defaults):

```json
{
  "rules": {
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "import/order": ["error", { "newlines-between": "always" }],
    "react/self-closing-comp": "error",
    "prefer-const": "error"
  }
}
```

Prettier enforces consistent formatting; no manual style debates in PRs.

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 4. Component Architecture Patterns

### 4.1 Server vs Client Component Decision Tree

```
Is this component interactive?
(onClick, onChange, useState, useEffect, browser APIs)
│
├── NO  → Server Component (RSC) ✅
│         - Fetch data directly in the component
│         - No 'use client' directive
│         - Renders HTML on the server, zero JS shipped
│
└── YES → Client Component
          │
          ├── Does it need data from the DB?
          │   ├── NO  → Add 'use client', receive data as props from RSC parent
          │   └── YES → Split: RSC parent fetches data, passes to Client child
          │
          └── Can it be deferred below the fold?
              └── YES → Consider React.lazy / Suspense for code splitting
```

### 4.2 Data Fetching in RSC (never `useEffect`)

```typescript
// ✅ tasks/page.tsx — Server Component fetches data
import { getTasksForUser } from '@/lib/services/tasks';
import { requireRole } from '@/lib/auth/rbac';
import { TaskList } from './_components/TaskList';
import { TaskFilters } from './_components/TaskFilters';

interface TasksPageProps {
  searchParams: Promise<{ status?: string; priority?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps): Promise<JSX.Element> {
  const user = await requireRole('MEMBER');
  const params = await searchParams;

  const tasks = await getTasksForUser(user.id, {
    status: params.status,
    priority: params.priority,
  });

  return (
    <main>
      <TaskFilters /> {/* Client Component: reads/writes URL params */}
      <TaskList tasks={tasks} /> {/* RSC: renders list from props */}
    </main>
  );
}
```

### 4.3 Passing Server Data to Client Components

```typescript
// ✅ Split pattern: RSC parent → Client child
// notes/[id]/page.tsx (RSC)
import { getNoteById } from '@/lib/services/notes';
import { NoteEditor } from './_components/NoteEditor'; // 'use client'

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const note = await getNoteById(id);

  // Pass plain serialisable data — no Prisma models with methods
  return <NoteEditor initialContent={note.body} noteId={note.id} />;
}
```

**Rule:** Never pass Prisma model instances to Client Components. Map to plain objects first.

```typescript
// ❌ — Prisma model (contains non-serialisable methods)
return <NoteEditor note={note} />;

// ✅ — Plain object
return <NoteEditor initialContent={note.body} noteId={note.id} updatedAt={note.updatedAt.toISOString()} />;
```

### 4.4 Component Props Convention

```typescript
// TaskCard.tsx
import type { TaskStatus, TaskPriority } from '@prisma/client';

// Props interface: always named ComponentNameProps
export interface TaskCardProps {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;   // ISO string (serialised from Date)
  tags: string[];
}

export function TaskCard({ id, title, status, priority, dueDate, tags }: TaskCardProps): JSX.Element {
  return (
    <article aria-label={`Task: ${title}`}>
      {/* ... */}
    </article>
  );
}
```

### 4.5 Server Action Integration Pattern

Client Components call Server Actions directly — no `fetch`:

```typescript
// _components/TaskForm.tsx
'use client';

import { useTransition } from 'react';
import { createTask } from '@/lib/actions/tasks';
import { useToast } from '@/components/providers/ToastProvider';

export function TaskForm(): JSX.Element {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(formData: FormData): void {
    startTransition(async () => {
      const result = await createTask(formData);

      if (!result.success) {
        toast({ variant: 'error', title: result.error.message });
        return;
      }

      toast({ variant: 'success', title: 'Task created' });
    });
  }

  return (
    <form action={handleSubmit}>
      {/* fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Create Task'}
      </button>
    </form>
  );
}
```

### 4.6 Shared `components/ui/` Primitives

UI primitives are unstyled by default, accepting a `className` prop for Tailwind composition:

```typescript
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/strings'; // clsx + twMerge wrapper

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent hover:bg-gray-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <span className="animate-spin mr-2">⟳</span> : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
```

### 4.7 Streaming with Suspense

Use `loading.tsx` for route-level Suspense, and inline `<Suspense>` for partial streaming:

```typescript
// tasks/page.tsx
import { Suspense } from 'react';
import { TaskList } from './_components/TaskList';
import { Skeleton } from '@/components/ui/Skeleton';

export default async function TasksPage(): Promise<JSX.Element> {
  return (
    <main>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TaskList /> {/* Async RSC — streams in when data is ready */}
      </Suspense>
    </main>
  );
}
```

---

## 5. API Design

### 5.1 Server Action Structure

All Server Actions follow this pattern: validate → authenticate → authorise → execute → return result.

```typescript
// lib/actions/tasks.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createTaskSchema } from '@/lib/schemas/task.schema';
import { requireRole } from '@/lib/auth/rbac';
import { createTask as createTaskService } from '@/lib/services/tasks';
import { logger } from '@/lib/logger';
import type { ActionResult } from '@/lib/types';
import type { CreateTaskInput } from '@/lib/schemas/task.schema';

export async function createTask(formData: FormData): Promise<ActionResult<{ id: string }>> {
  // 1. Parse & validate
  const raw = Object.fromEntries(formData);
  const parsed = createTaskSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors } };
  }

  // 2. Authenticate
  const user = await requireRole('MEMBER');

  // 3. Execute service
  try {
    const task = await createTaskService({ ...parsed.data, ownerId: user.id });
    logger.info({ taskId: task.id, userId: user.id }, 'Task created');

    // 4. Revalidate affected caches
    revalidatePath('/tasks');

    return { success: true, data: { id: task.id } };
  } catch (err) {
    logger.error({ err, userId: user.id }, 'Failed to create task');
    return { success: false, error: { message: 'Failed to create task. Please try again.' } };
  }
}
```

**`ActionResult<T>` type:**

```typescript
// lib/types.ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };
```

### 5.2 Route Handler Structure

```typescript
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/rbac';
import { listTasksQuerySchema } from '@/lib/schemas/task.schema';
import { getTasksForUser } from '@/lib/services/tasks';
import { logger } from '@/lib/logger';
import { AppError, ForbiddenError } from '@/lib/errors';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireRole('MEMBER');

    const { searchParams } = req.nextUrl;
    const query = listTasksQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await getTasksForUser(user.id, query);

    return NextResponse.json({ data: result.tasks, meta: result.meta });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireRole('MEMBER');
    const body: unknown = await req.json();

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: parsed.error.flatten().fieldErrors } },
        { status: 422 },
      );
    }

    const task = await createTaskService({ ...parsed.data, ownerId: user.id });
    logger.info({ taskId: task.id, userId: user.id }, 'Task created via API');

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
```

**Centralised error handler for Route Handlers:**

```typescript
// lib/errors.ts
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super('NOT_FOUND', `${entity} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 'Authentication required', 401);
  }
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.statusCode },
    );
  }

  logger.error({ err }, 'Unhandled route error');
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 },
  );
}
```

### 5.3 Zod Schema Conventions

```typescript
// lib/schemas/task.schema.ts
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

// Reusable field validators
const title = z.string().min(1, 'Title is required').max(200, 'Title too long');
const tags = z.array(z.string().max(50)).max(20).default([]);

// Create schema (all required fields + optionals)
export const createTaskSchema = z.object({
  title,
  description: z.string().max(10_000).optional(),
  status: z.nativeEnum(TaskStatus).default('BACKLOG'),
  priority: z.nativeEnum(TaskPriority).default('MEDIUM'),
  dueDate: z.string().date().optional().nullable(),
  tags,
});

// Update schema (all fields optional — PATCH semantics)
export const updateTaskSchema = createTaskSchema.partial();

// Query/filter schema
export const listTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  tag: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

// Inferred TypeScript types (export these, not manual types)
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
```

### 5.4 Service Layer

Services are pure functions with no HTTP concerns — they only interact with Prisma:

```typescript
// lib/services/tasks.ts
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/errors';
import type { CreateTaskInput, ListTasksQuery } from '@/lib/schemas/task.schema';
import type { Task } from '@prisma/client';

export async function createTask(
  input: CreateTaskInput & { ownerId: string },
): Promise<Task> {
  return prisma.task.create({
    data: {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function getTaskById(id: string, requestingUserId: string): Promise<Task> {
  const task = await prisma.task.findFirst({
    where: { id, ownerId: requestingUserId },
  });

  if (!task) throw new NotFoundError('Task');
  return task;
}

export async function getTasksForUser(
  userId: string,
  query: ListTasksQuery,
): Promise<{ tasks: Task[]; meta: { nextCursor: string | null; total: number } }> {
  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where: {
        ownerId: userId,
        ...(query.status && { status: query.status }),
        ...(query.priority && { priority: query.priority }),
        ...(query.tag && { tags: { has: query.tag } }),
        ...(query.cursor && { id: { lt: query.cursor } }),
      },
      orderBy: { updatedAt: 'desc' },
      take: query.limit + 1,
    }),
    prisma.task.count({ where: { ownerId: userId } }),
  ]);

  const hasMore = tasks.length > query.limit;
  const items = hasMore ? tasks.slice(0, -1) : tasks;

  return {
    tasks: items,
    meta: {
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
      total,
    },
  };
}
```

---

## 6. State Management Strategy

### 6.1 State Classification

| State Type         | Tool                           | Examples                                          |
|--------------------|--------------------------------|---------------------------------------------------|
| Server / DB state  | RSC + `revalidatePath`         | Task list, work logs, achievements                |
| URL / filter state | `URLSearchParams` + `useRouter`| Task filters, search query, active date           |
| Ephemeral UI state | `useState`                     | Dialog open/close, hover, accordion               |
| Form state         | React `form` + `useTransition` | Create/edit forms with Server Actions             |
| Optimistic state   | `useOptimistic`                | To-do completion, task status toggle              |
| Draft state        | `useState` + periodic Server Action | Note editor auto-save                        |

**There is no global client state manager (Zustand, Redux) in v1.** The combination of RSC, URL state, and `useOptimistic` covers all requirements.

### 6.2 URL State for Filters

Filters are stored in the URL so they are bookmarkable and shareable (BRD AC-T-03-3):

```typescript
// _components/TaskFilters.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { TaskStatus } from '@prisma/client';

export function TaskFilters(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <div role="search" aria-label="Task filters">
      {/* Status filter — calls setFilter('status', value) */}
    </div>
  );
}
```

### 6.3 Optimistic Updates for To-Do Completion

```typescript
// _components/TodoItem.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { completeTodo } from '@/lib/actions/todos';

interface TodoItemProps {
  id: string;
  title: string;
  isComplete: boolean;
}

export function TodoItem({ id, title, isComplete }: TodoItemProps): JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [optimisticComplete, setOptimistic] = useOptimistic(isComplete);

  function handleToggle(): void {
    startTransition(async () => {
      setOptimistic(!optimisticComplete);
      await completeTodo(id, !optimisticComplete);
    });
  }

  return (
    <label className={optimisticComplete ? 'line-through opacity-50' : ''}>
      <input
        type="checkbox"
        checked={optimisticComplete}
        onChange={handleToggle}
        disabled={isPending}
        aria-label={`Mark "${title}" as ${optimisticComplete ? 'incomplete' : 'complete'}`}
      />
      {title}
    </label>
  );
}
```

### 6.4 Note Auto-Save

```typescript
// _components/NoteEditor.tsx (excerpt)
'use client';

import { useEffect, useRef, useTransition } from 'react';
import { saveDraft } from '@/lib/actions/notes';

const AUTOSAVE_INTERVAL_MS = 30_000;

export function NoteEditor({ noteId, initialContent }: NoteEditorProps): JSX.Element {
  const contentRef = useRef<string>(initialContent);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        await saveDraft(noteId, contentRef.current);
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [noteId]);

  // ... Tiptap editor; updates contentRef.current on change
}
```

---

## 7. Error Handling Patterns

### 7.1 Error Hierarchy

```
Error (native)
└── AppError                    lib/errors.ts
    ├── UnauthorizedError       401
    ├── ForbiddenError          403
    ├── NotFoundError           404
    ├── ValidationError         422
    └── ConflictError           409
```

### 7.2 Server Action Error Handling

Server Actions **never throw to the client**. They return a typed `ActionResult<T>`:

```typescript
// ✅ Correct
export async function deleteNote(id: string): Promise<ActionResult<void>> {
  try {
    const user = await requireRole('MEMBER');
    const note = await getNoteById(id, user.id);

    await softDeleteNote(note.id);
    revalidatePath('/notes');

    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return { success: false, error: { message: 'You do not have permission to delete this note.' } };
    }
    if (err instanceof NotFoundError) {
      return { success: false, error: { message: 'Note not found.' } };
    }
    logger.error({ err }, 'deleteNote failed');
    return { success: false, error: { message: 'Failed to delete note. Please try again.' } };
  }
}
```

### 7.3 Route Segment Error Boundaries

Each route segment has an `error.tsx` that catches rendering and async errors:

```typescript
// app/(app)/tasks/error.tsx
'use client'; // error.tsx must be a Client Component

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TasksError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    // Sentry.captureException(error); // uncomment when Sentry is configured
    logger.error({ digest: error.digest }, error.message);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-gray-500">We couldn&apos;t load your tasks.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### 7.4 Global `error.tsx`

```typescript
// app/error.tsx — catches errors not caught by nested error.tsx files
'use client';

export default function GlobalError({ error, reset }: ErrorProps): JSX.Element {
  return (
    <html>
      <body>
        <div role="alert">
          <h1>Application error</h1>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
```

### 7.5 Not Found Pattern

```typescript
// In service
import { notFound } from 'next/navigation';

export async function getNote(id: string) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) notFound(); // triggers not-found.tsx
  return note;
}
```

### 7.6 Client-Side Error Boundary for Non-Route Components

```typescript
// Wrap interactive widgets that could fail in isolation
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<div>Search unavailable</div>}>
  <CmdK />
</ErrorBoundary>
```

---

## 8. Logging Strategy

### 8.1 Logger Setup

```typescript
// lib/logger.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
  // In production: structured JSON, picked up by Vercel Log Drains
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.passwordHash', '*.email'],
    censor: '[REDACTED]',
  },
});
```

### 8.2 Log Levels

| Level   | When to use                                                                 |
|---------|-----------------------------------------------------------------------------|
| `error` | Unhandled exceptions, service failures, data integrity violations.          |
| `warn`  | Recoverable issues: rate-limit hit, deprecated usage, invalid input rejected.|
| `info`  | Significant business events: user created, task archived, export generated. |
| `debug` | Developer-aid: query plans, middleware decisions, cache hits/misses.         |

### 8.3 Structured Log Fields

Always include a **context object** as the first argument to carry structured fields:

```typescript
// ✅ Structured — queryable in log aggregators
logger.info({ userId: user.id, taskId: task.id, action: 'archive' }, 'Task archived');
logger.error({ err, userId: user.id, noteId: id }, 'Failed to soft-delete note');
logger.warn({ userId: user.id, attempts: count }, 'Login rate limit approaching');

// ❌ String interpolation — not queryable
logger.info(`User ${user.id} archived task ${task.id}`);
```

### 8.4 Request Context (Route Handlers)

```typescript
// lib/logger.ts — child logger with request context
export function createRequestLogger(req: NextRequest): pino.Logger {
  return logger.child({
    requestId: req.headers.get('x-vercel-id') ?? crypto.randomUUID(),
    method: req.method,
    path: req.nextUrl.pathname,
  });
}

// Usage in a Route Handler:
export async function GET(req: NextRequest): Promise<NextResponse> {
  const log = createRequestLogger(req);
  log.debug('Handling GET /api/tasks');
  // ...
}
```

### 8.5 What NOT to Log (PII / Security)

| Data                        | Rule                                    |
|-----------------------------|-----------------------------------------|
| Passwords / hashes          | Never. pino `redact` removes them.      |
| Full email addresses        | Redacted in prod; partial in debug only.|
| Session tokens / JWT        | Never.                                  |
| Full request bodies         | Log shape only (field names, not values).|
| IP addresses                | Log for auth events only (AuthEvent table); not in app logs. |

### 8.6 Sentry Integration

```typescript
// lib/logger.ts — extend pino error handler to forward to Sentry
import * as Sentry from '@sentry/nextjs';

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  logger.error({ err, ...context }, err instanceof Error ? err.message : 'Unknown error');
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err, { extra: context });
  }
}
```

---

## 9. Testing Approach

### 9.1 Strategy Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Test Pyramid                         │
│                                                             │
│              ┌─────────────────┐                            │
│              │  E2E (Playwright)│  ← Critical user journeys │
│              │   ~20–30 specs   │                            │
│           ┌──┴──────────────────┴──┐                        │
│           │  Integration (Jest)     │  ← Route Handlers,     │
│           │   Route Handlers + DB   │    Service + real DB   │
│       ┌───┴─────────────────────────┴───┐                   │
│       │     Unit (Jest + RTL)           │  ← Services, Zod,  │
│       │  Services, schemas, components  │    components      │
│       └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  collectCoverageFrom: [
    'lib/services/**/*.ts',
    'lib/actions/**/*.ts',
    'lib/schemas/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
  projects: [
    // Node environment: services, schemas, Route Handlers
    { displayName: 'node', testEnvironment: 'node', testMatch: ['**/*.test.ts'] },
    // jsdom environment: React components
    { displayName: 'dom', testEnvironment: 'jsdom', testMatch: ['**/*.test.tsx'] },
  ],
};

export default createJestConfig(config);
```

### 9.3 Unit Tests — Service Layer

Co-locate service tests next to the service file:

```typescript
// lib/services/tasks.test.ts
import { prismaMock } from '@/tests/mocks/prisma';
import { createTask, getTaskById } from './tasks';
import { NotFoundError } from '@/lib/errors';

// Mock Prisma using a singleton pattern
jest.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }));

describe('createTask', () => {
  it('creates a task with owner and default status', async () => {
    const input = { title: 'Write unit tests', ownerId: 'user-1', tags: [] };
    prismaMock.task.create.mockResolvedValue({ id: 'task-1', status: 'BACKLOG', ...input } as any);

    const task = await createTask(input);

    expect(prismaMock.task.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Write unit tests' }) }),
    );
    expect(task.id).toBe('task-1');
  });
});

describe('getTaskById', () => {
  it('throws NotFoundError when task does not exist', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(getTaskById('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when task belongs to different user', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null); // Prisma returns null when ownerId doesn't match

    await expect(getTaskById('task-1', 'other-user')).rejects.toThrow(NotFoundError);
  });
});
```

**Prisma mock singleton:**

```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => { mockReset(prismaMock); });
```

### 9.4 Unit Tests — Zod Schemas

```typescript
// lib/schemas/task.schema.test.ts
import { createTaskSchema } from './task.schema';

describe('createTaskSchema', () => {
  it('accepts valid input', () => {
    const result = createTaskSchema.safeParse({ title: 'My Task' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.title).toBeDefined();
  });

  it('rejects title exceeding 200 chars', () => {
    const result = createTaskSchema.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('defaults status to BACKLOG', () => {
    const result = createTaskSchema.safeParse({ title: 'Task' });
    expect(result.success && result.data.status).toBe('BACKLOG');
  });
});
```

### 9.5 Component Tests — React Testing Library

```typescript
// app/(app)/tasks/_components/TaskStatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskStatusBadge } from './TaskStatusBadge';

describe('TaskStatusBadge', () => {
  it.each([
    ['BACKLOG', 'Backlog'],
    ['IN_PROGRESS', 'In Progress'],
    ['DONE', 'Done'],
  ])('renders label for status %s', (status, expectedLabel) => {
    render(<TaskStatusBadge status={status as TaskStatus} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });
});
```

**Testing interactive Client Components with user-event:**

```typescript
// _components/TaskFilters.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFilters } from './TaskFilters';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks',
}));

describe('TaskFilters', () => {
  it('updates URL when status filter changes', async () => {
    const mockPush = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    render(<TaskFilters />);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'IN_PROGRESS');
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('status=IN_PROGRESS'), expect.any(Object));
  });
});
```

### 9.6 Integration Tests — Route Handlers

Integration tests run against a real test database (separate from dev):

```typescript
// app/api/tasks/route.test.ts
import { GET, POST } from './route';
import { createTestUser, cleanupDb } from '@/tests/helpers/db';
import { NextRequest } from 'next/server';

describe('GET /api/tasks', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await createTestUser({ role: 'MEMBER' });
  });

  afterAll(() => cleanupDb());

  it('returns 401 when not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/tasks');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns tasks for authenticated user', async () => {
    // Set up authenticated session in test context
    const req = buildAuthenticatedRequest('http://localhost/api/tasks', userId);
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });
});
```

### 9.7 E2E Tests — Playwright

```typescript
// e2e/specs/tasks.spec.ts
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Task management', () => {
  test('creates a task and verifies it appears in the list', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByLabel('Title').fill('E2E test task');
    await page.getByLabel('Priority').selectOption('HIGH');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText('E2E test task')).toBeVisible();
    await expect(page.getByText('Task created')).toBeVisible(); // toast
  });

  test('filters tasks by status', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    await page.getByLabel('Status').selectOption('IN_PROGRESS');

    await expect(page).toHaveURL(/status=IN_PROGRESS/);
    // Verify only IN_PROGRESS tasks are shown
    const statuses = page.getByTestId('task-status');
    await expect(statuses).not.toContainText('Backlog');
  });
});
```

**Authenticated page fixture:**

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';
import { seedTestUser } from './helpers/db';

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    const { email, password } = await seedTestUser();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### 9.8 Accessibility Tests

```typescript
// e2e/specs/a11y/wcag.spec.ts
import { test, expect } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';

test.describe('WCAG 2.1 AA — Tasks page', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/tasks');
    await injectAxe(page);
    await checkA11y(page, undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
  });
});
```

### 9.9 Test Conventions

| Convention                          | Rule                                                                              |
|-------------------------------------|-----------------------------------------------------------------------------------|
| Describe block naming               | `describe('functionName / ComponentName')` — mirrors the subject under test.     |
| Test naming                         | `it('does X when Y')` — plain English, present tense.                            |
| Arrange-Act-Assert                  | Every test has a clear setup, action, and assertion section.                      |
| One assertion per concept           | Split large tests; each test should be independently meaningful.                  |
| No test interdependence             | Tests must pass in any order; each sets up and tears down its own data.           |
| Mock only at module boundary        | Mock Prisma, external APIs, and `next/navigation` — not internal utilities.       |
| Avoid `any` in tests                | Apply the same TypeScript strictness; test types reveal design issues early.      |

---

## 10. Configuration & Environment

### 10.1 Environment Variables

All required variables are documented in `.env.example` (committed):

```bash
# .env.example — copy to .env.local for development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mywork_dev?schema=public"

# Auth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Email
RESEND_API_KEY="re_..."
RESEND_FROM="MyWork <noreply@mywork.app>"
EMAIL_FROM="MyWork <noreply@example.com>"

# Observability
LOG_LEVEL="debug"
SENTRY_DSN=""

# Production only
PRISMA_ACCELERATE_URL=""
```

### 10.2 Typed Environment Variables

Use `@t3-oss/env-nextjs` to validate env vars at build time:

```typescript
// env.ts (root)
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    RESEND_API_KEY: z.string().startsWith('re_').optional(),
    RESEND_FROM: z.string().optional(),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    LOG_LEVEL: process.env.LOG_LEVEL,
  },
});
```

This causes the build to fail fast if a required variable is missing or malformed.

### 10.3 `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  experimental: {
    typedRoutes: true,        // compile-time route validation
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders, // defined in lib/security-headers.ts
      },
    ];
  },
};

export default config;
```

---

## 11. Database Conventions

### 11.1 Prisma Schema Conventions

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ──────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  MANAGER
  MEMBER
}

enum TaskStatus {
  BACKLOG
  IN_PROGRESS
  BLOCKED
  IN_REVIEW
  DONE
  ARCHIVED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// ── Models ─────────────────────────────────────────────────────────────────

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String?                    // Nullable — not always provided by OAuth
  passwordHash String?                    // Null for OAuth-only accounts
  image        String?                    // Profile image from OAuth provider
  role         Role      @default(MEMBER)
  isActive     Boolean   @default(true)  // Always set explicitly to false on create; admin activates
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  tasks        Task[]
  workLogs     WorkLog[]
  achievements Achievement[]
  notes        Note[]
  todos        TodoItem[]
  sessions     Session[]
  authEvents   AuthEvent[]
  memberships  GroupMembership[]

  @@map("users")
}

model Task {
  id           String     @id @default(uuid())
  title        String     @db.VarChar(200)
  description  String?    @db.Text
  status       TaskStatus @default(BACKLOG)
  priority     Priority   @default(MEDIUM)
  dueDate      DateTime?  @db.Date
  tags         String[]
  ownerId      String
  deletedAt    DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  owner        User        @relation(fields: [ownerId], references: [id])
  workLogs     WorkLog[]
  notes        Note[]
  todos        TodoItem[]
  achievements Achievement[]

  @@index([ownerId, status])
  @@index([ownerId, dueDate])
  @@map("tasks")
}
```

**Conventions:**
- All models use `@@map("snake_case_table_name")` so SQL tables are snake_case.
- All IDs are `uuid()`, never auto-increment integers.
- Timestamps: always `createdAt @default(now())` and `updatedAt @updatedAt`.
- Soft-deletable models have `deletedAt DateTime?`.
- `@db.VarChar(n)` enforced for bounded string fields matching BRD character limits.

### 11.2 Migration Rules

- `prisma migrate dev --name descriptive-name` in development.
- `prisma migrate deploy` in CI (never `migrate dev` in production).
- Migrations must be reviewed in PR before merging to `develop`.
- **Never** edit an already-deployed migration file. Create a new one.
- Additive changes only on `main` (columns with defaults, new tables, new indexes). Destructive in two phases.

### 11.3 Seeding

```typescript
// prisma/seed.ts
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/passwords';

async function main(): Promise<void> {
  const adminPassword = await hashPassword('admin-dev-password');

  await prisma.user.upsert({
    where: { email: 'admin@mywork.local' },
    update: {},
    create: {
      email: 'admin@mywork.local',
      name: 'Dev Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 12. Git & CI/CD Conventions

### 12.1 Branch Strategy

```
main          ← production; protected; requires PR + passing CI
  └── develop ← integration; protected; PRs target here
        └── feature/MYWORK-001-task-creation
        └── fix/MYWORK-042-todo-carryover-date-bug
        └── chore/MYWORK-100-upgrade-prisma
        └── docs/MYWORK-110-update-tdd
```

**Rules:**
- All work is done on a feature branch off `develop`.
- PRs must target `develop`, never `main` directly.
- `main` ← `develop` merges only happen as release PRs with Tech Lead approval.

### 12.2 Commit Message Format

Follows Conventional Commits:

```
<type>(<scope>): <short summary>

[optional body — explain WHY, not WHAT]

[optional footer: MYWORK-001, BREAKING CHANGE: ...]
```

| Type       | When to use                                                      |
|------------|------------------------------------------------------------------|
| `feat`     | A new feature visible to users or other services.                |
| `fix`      | A bug fix.                                                       |
| `chore`    | Maintenance: dependency updates, config changes, tooling.        |
| `docs`     | Documentation only (BRD, SAD, TDD, README, code comments).       |
| `refactor` | Code change that neither fixes a bug nor adds a feature.         |
| `test`     | Adding or fixing tests with no production code change.           |
| `perf`     | Performance improvement.                                         |

**Examples:**
```
feat(tasks): add drag-to-reorder on task list
fix(todos): carry-over prompt not shown for previous day items
chore(deps): upgrade Next.js to 15.3.1
test(services): add coverage for getTaskById NotFoundError case
```

### 12.3 Pull Request Checklist

PRs must include a description covering:

- [ ] What changed and why (link to BRD/SAD section if applicable).
- [ ] Tests added or updated (unit, integration, E2E).
- [ ] New Zod schemas for any new inputs.
- [ ] `logger` used instead of `console.log`.
- [ ] RBAC enforced server-side for any new Route Handler or Server Action.
- [ ] No `any` types introduced.
- [ ] Accessibility: keyboard navigation and ARIA labels on new interactive elements.
- [ ] Breaking change? Flag it explicitly and note required migration steps.

### 12.4 GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run type-check     # tsc --noEmit
      - run: npm run lint           # eslint
      - run: npm run format:check   # prettier --check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: mywork_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
    env:
      DATABASE_URL: postgresql://postgres:test@localhost:5432/mywork_test
      NEXTAUTH_SECRET: test-secret-min-32-chars-for-ci-use
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test -- --coverage --ci
      - uses: codecov/codecov-action@v4   # optional coverage reporting

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high

  build:
    needs: [quality, test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          EMAIL_FROM: ${{ secrets.EMAIL_FROM }}

  e2e:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          BASE_URL: ${{ steps.deploy.outputs.preview-url }}
```

---

---

## 13. Change Log

| Version | Date       | Author           | Summary                                                                                                            |
|---------|------------|------------------|--------------------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-02-24 | Engineering Team | Initial release.                                                                                                   |
| 1.1     | 2026-03-04 | Tech Lead        | Updated `lib/email/` structure to actual files (`resend.ts`, `notifications.ts`); removed `react-email`; corrected env var `EMAIL_FROM` → `RESEND_FROM`; updated related doc references to v1.1. |
| 1.2     | 2026-03-05 | Tech Lead        | Added `AppShell.tsx` to `(app)/_components/` and `components/layout/`; documented mobile sidebar drawer pattern (`translate-x` overlay, `useEffect` auto-close); noted JWT callback DB-UUID lookup for OAuth; GitHub OAuth active, Google/Facebook UI-disabled; responsive Tailwind grid/header patterns (`grid-cols-1 sm:grid-cols-2/3`, `flex-col sm:flex-row`); updated related doc references to v1.2. |

---

*End of Document — TDD-001 v1.2*
