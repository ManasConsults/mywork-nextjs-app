# Solution Architecture Document (SAD)

## Finance Module — *MyWork*

| Field         | Value                               |
|---------------|-------------------------------------|
| Document ID   | SAD-002                             |
| Version       | 1.2                                 |
| Status        | Draft                               |
| Author        | Architecture Team                   |
| Date          | 2026-03-06                          |
| Related BRD   | BRD-002 v1.2                        |
| Related SAD   | SAD-001 v1.3 (Work Management)      |
| Reviewers     | Tech Lead, Security, Platform, QA   |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Principles](#2-architecture-principles)
3. [Module Placement in Existing Architecture](#3-module-placement-in-existing-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Data Architecture](#5-data-architecture)
6. [Key Data Flows](#6-key-data-flows)
7. [API Design](#7-api-design)
8. [PDF Generation](#8-pdf-generation)
9. [Security Architecture](#9-security-architecture)
10. [Architecture Decision Records](#10-architecture-decision-records)
11. [Glossary](#11-glossary)
12. [Change Log](#12-change-log)

---

## 1. Introduction

### 1.1 Purpose

This document defines the solution architecture for the Finance module added to the *MyWork* application. It extends SAD-001 and specifies how new domain models, services, routes, and components integrate with the existing system without disrupting it.

### 1.2 Scope

This SAD covers:
- Integration strategy: how the Finance module fits into the existing Next.js app.
- Data model: new Prisma schema additions and extensions to existing models.
- Service layer: new services in `lib/services/finance/`.
- Route structure: new pages under `app/(app)/finance/`.
- PDF generation: server-side invoice PDF rendering.
- Timesheet integration: the data flow between Work Logs and Invoices.
- Security: data scoping, monetary integrity, and relevant ADRs.

### 1.3 Relationship to SAD-001

All architecture principles, container topology, deployment architecture, authentication, RBAC middleware, error handling patterns, and logging conventions defined in SAD-001 apply unchanged. This document records only the additions and extensions.

---

## 2. Architecture Principles

The following principles extend those in SAD-001 §2 and are specific to the Finance module.

| ID    | Principle                     | Rationale                                                                              |
|-------|-------------------------------|----------------------------------------------------------------------------------------|
| AP-F1 | Monetary amounts as integers  | Store all money as integers in the smallest currency unit (e.g., pence, cents) to eliminate floating-point rounding errors entirely. |
| AP-F2 | Derived balances, never stored | Account balance is always computed from transactions. No mutable `balance` column exists on the Account model. This is the single source of truth. |
| AP-F3 | Frozen invoice totals          | Once an invoice is `Sent`, its subtotal, tax, and total are stored as immutable computed values. They are not recalculated on read. |
| AP-F4 | Strict user data scoping       | Every Finance query includes `userId` in the `WHERE` clause or is accessed through a server action that enforces the authenticated user's identity. Cross-user access is architecturally impossible at the service layer. |
| AP-F5 | Integration via FK, not duplication | Work log data is linked to invoice line items via foreign key; it is never copied or duplicated into the Finance tables. |

---

## 3. Module Placement in Existing Architecture

### 3.0 Module Access Gate

Before any Finance route renders, `app/(app)/finance/layout.tsx` checks `session.user.moduleFinance`. If `false`, the user is redirected to `/module-unavailable`. This check is in addition to the base authentication guard in `app/(app)/layout.tsx`.

The Finance sidebar navigation group is rendered conditionally — see SAD-001 §10.3.0 for the full session callback and Sidebar implementation pattern.

### 3.1 Route Group

The Finance module lives entirely within the existing `(app)` route group, protected by the same server-side session guard in `app/(app)/layout.tsx`.

```
app/
└── (app)/
    ├── _components/         ← shared (Sidebar, AppShell) — extended with Finance nav group
    ├── dashboard/
    ├── tasks/
    ├── work-logs/
    ├── finance/             ← NEW — Finance module root
    │   ├── page.tsx             Finance dashboard
    │   ├── accounts/
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── transactions/
    │   │   ├── page.tsx
    │   │   └── new/page.tsx
    │   ├── budgets/
    │   │   └── page.tsx
    │   ├── clients/
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── invoices/
    │   │   ├── page.tsx
    │   │   ├── new/page.tsx
    │   │   └── [id]/page.tsx
    │   ├── timesheets/
    │   │   └── page.tsx
    │   └── reports/
    │       └── page.tsx
    └── ...
```

### 3.2 Sidebar Navigation Groups

The Sidebar is updated to support grouped navigation sections. The existing nav links move into a **Work** section; a new **Finance** section is added below it.

```
Work
  Dashboard
  Tasks
  Work Logs
  Achievements
  Notes
  To-do

Finance
  Overview
  Transactions
  Invoices
  Timesheets
  Reports
```

The Sidebar component is extended to render a `SidebarGroup` with a label. The data structure (currently a flat `NAV_LINKS` array) is refactored to a grouped array — no change to the visual shell otherwise.

### 3.3 Shared Infrastructure (Unchanged)

| Concern              | Resolution                                              |
|----------------------|---------------------------------------------------------|
| Authentication       | Same NextAuth.js JWT session; Finance pages use the same `app/(app)/layout.tsx` server-side guard. |
| RBAC                 | Finance data is personal — scoped to `userId`. Admin and Manager roles do not gain visibility into other users' financial data. |
| Error handling       | Same `ActionResult<T>` pattern from SAD-001; Finance server actions follow the same contract. |
| Logging              | Same pino logger; Finance service methods log context objects (no PII, no monetary amounts). |
| Email                | Resend already integrated; invoice email reuses the same `lib/email/resend.ts` client. |

---

## 4. Component Architecture

### 4.1 Service Layer

New services are co-located under `lib/services/finance/`:

```
lib/services/finance/
├── account.service.ts       getAccounts, getAccountById, createAccount, updateAccount, archiveAccount
│                            getAccountBalance (derived from transactions — no stored field)
├── transaction.service.ts   getTransactions, createTransaction, updateTransaction, deleteTransaction
│                            getTransactionSummary (total in/out for a period)
├── category.service.ts      getCategories, createCategory, updateCategory, deleteCategory
├── budget.service.ts        getBudgets, getBudgetProgress (actual vs budget per category/period)
│                            createBudget, updateBudget, deleteBudget
├── client.service.ts        getClients, getClientById, createClient, updateClient, archiveClient
├── invoice.service.ts       getInvoices, getInvoiceById, createInvoice, updateInvoice
│                            sendInvoice (transitions status + emails PDF)
│                            sendPaymentReminder (emails reminder + PDF; increments reminderCount)
│                            markInvoicePaid, cancelInvoice
│                            generateInvoicePdf (returns Buffer)
├── line-item.service.ts     addLineItem, addLineItemsFromWorkLogs, updateLineItem, deleteLineItem
│                            revertBilledWorkLogs (called on invoice cancel/revert to draft)
└── report.service.ts        getProfitAndLoss, getCashFlow, getTaxSummary, getUnbilledHours
```

All services are pure async functions. They accept explicit parameters (no request objects), use Prisma for DB access, and enforce `userId` scoping on every query.

### 4.2 Schemas

```
lib/schemas/finance/
├── account.schema.ts        createAccountSchema, updateAccountSchema
├── transaction.schema.ts    createTransactionSchema, updateTransactionSchema
├── category.schema.ts       createCategorySchema, updateCategorySchema
├── budget.schema.ts         createBudgetSchema, updateBudgetSchema
├── client.schema.ts         createClientSchema, updateClientSchema
├── invoice.schema.ts        createInvoiceSchema, updateInvoiceSchema, sendInvoiceSchema
└── line-item.schema.ts      createLineItemSchema, addFromWorkLogsSchema
```

### 4.3 Server Actions

```
lib/actions/finance/
├── account.ts               createAccountAction, updateAccountAction, archiveAccountAction
├── transaction.ts           createTransactionAction, updateTransactionAction, deleteTransactionAction
├── category.ts              createCategoryAction, updateCategoryAction, deleteCategoryAction
├── budget.ts                createBudgetAction, updateBudgetAction, deleteBudgetAction
├── client.ts                createClientAction, updateClientAction, archiveClientAction
├── invoice.ts               createInvoiceAction, updateInvoiceAction, sendInvoiceAction
│                            sendPaymentReminderAction, markPaidAction, cancelInvoiceAction, revertToDraftAction
└── line-item.ts             addLineItemAction, addFromWorkLogsAction, updateLineItemAction, deleteLineItemAction
```

All actions return `ActionResult<T>` (as defined in SAD-001) — never throw to the client.

### 4.4 Route Handler (PDF Download)

PDF generation returns a binary file, which cannot be returned from a Server Action. A Route Handler is used:

```
app/api/finance/invoices/[id]/pdf/route.ts
  GET — authenticates session, fetches invoice, generates PDF buffer, returns as application/pdf
```

---

## 5. Data Architecture

### 5.1 Monetary Representation

All monetary values are stored as `Int` in the database, representing the smallest unit of the user's currency (e.g., pence for GBP, cents for AUD/USD/EUR). The display layer converts to decimal for rendering. This eliminates all floating-point precision issues.

Example: £12.50 is stored as `1250`.

A utility module `lib/utils/money.ts` provides:
- `toMinorUnit(decimal: number): number` — multiply and round
- `fromMinorUnit(minor: number): string` — format to locale string

### 5.2 Prisma Schema Extensions

#### New Models

```prisma
model Account {
  id            String        @id @default(uuid())
  userId        String
  name          String
  type          AccountType
  openingBalance Int          @default(0)         // minor units
  currency      String        @default("GBP")
  isDefault     Boolean       @default(false)
  description   String?
  archivedAt    DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  transactions  Transaction[]
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}

enum AccountType {
  CHECKING
  SAVINGS
  CASH
  CREDIT
  INVESTMENT
}

model Category {
  id            String         @id @default(uuid())
  userId        String
  name          String
  type          CategoryType
  parentId      String?
  colour        String?
  icon          String?
  createdAt     DateTime       @default(now())
  parent        Category?      @relation("CategoryChildren", fields: [parentId], references: [id])
  children      Category[]     @relation("CategoryChildren")
  transactions  Transaction[]
  budgets       Budget[]
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("categories")
}

enum CategoryType {
  PERSONAL
  WORK_RELATED
  BUSINESS
}

model Transaction {
  id            String          @id @default(uuid())
  userId        String
  accountId     String
  categoryId    String
  type          TransactionType
  amount        Int                                // minor units, always positive; type determines sign
  description   String?
  reference     String?
  date          DateTime
  isRecurring   Boolean         @default(false)
  recurringId   String?                            // links recurrences in a series
  recurFrequency RecurFrequency?
  recurEndsAt   DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  account       Account         @relation(fields: [accountId], references: [id])
  category      Category        @relation(fields: [categoryId], references: [id])
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER_OUT
  TRANSFER_IN
}

enum RecurFrequency {
  WEEKLY
  FORTNIGHTLY
  MONTHLY
  QUARTERLY
  ANNUALLY
}

model Budget {
  id          String       @id @default(uuid())
  userId      String
  categoryId  String
  amount      Int                              // minor units
  period      BudgetPeriod
  startDate   DateTime
  endDate     DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  category    Category     @relation(fields: [categoryId], references: [id])
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId, period, startDate])
  @@map("budgets")
}

enum BudgetPeriod {
  MONTHLY
  ANNUAL
}

model Client {
  id             String    @id @default(uuid())
  userId         String
  name           String
  email          String?
  phone          String?
  address        String?
  defaultRate    Int?                            // minor units per hour
  currency       String    @default("GBP")
  notes          String?
  archivedAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  invoices       Invoice[]
  workLogs       WorkLog[]
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("clients")
}

model Invoice {
  id              String        @id @default(uuid())
  userId          String
  clientId        String
  invoiceNumber   String
  status          InvoiceStatus @default(DRAFT)
  issueDate       DateTime
  dueDate         DateTime?
  notes           String?
  taxRate         Int           @default(0)      // basis points, e.g. 2000 = 20%
  subtotal        Int           @default(0)      // minor units — frozen on send
  taxAmount       Int           @default(0)      // minor units — frozen on send
  total           Int           @default(0)      // minor units — frozen on send
  currency        String        @default("GBP")
  sentAt          DateTime?
  paidAt          DateTime?
  reminderCount   Int           @default(0)      // number of payment reminders sent
  lastReminderAt  DateTime?                      // when most recent reminder was sent
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  lineItems       InvoiceLineItem[]
  client          Client        @relation(fields: [clientId], references: [id])
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, invoiceNumber])
  @@map("invoices")
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  CANCELLED
}

// Overdue is derived at read time: status = SENT && dueDate < now()

model InvoiceLineItem {
  id          String   @id @default(uuid())
  invoiceId   String
  description String
  quantity    Decimal  @db.Decimal(10, 2)       // e.g., 1.5 hours
  unitPrice   Int                               // minor units
  total       Int                               // minor units (quantity × unitPrice, rounded)
  sortOrder   Int      @default(0)
  workLogId   String?  @unique                  // nullable FK — one workLog per line item max
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  workLog     WorkLog? @relation(fields: [workLogId], references: [id])

  @@map("invoice_line_items")
}
```

#### Extensions to Existing Models

```prisma
// WorkLog model — add these fields:
model WorkLog {
  // ... existing fields ...
  billable            Boolean          @default(false)
  clientId            String?
  billedAt            DateTime?                      // set when added to a sent invoice
  invoiceLineItem     InvoiceLineItem?               // back-relation
  client              Client?          @relation(fields: [clientId], references: [id])
}

// User model — add finance and module licensing fields:
model User {
  // ... existing fields ...
  moduleWork          Boolean          @default(true)   // Work module access (FR-UG-05)
  moduleFinance       Boolean          @default(true)   // Finance module access (FR-UG-05)
  currency            String           @default("GBP")
  businessName        String?                           // displayed on invoice PDF
  // Finance relations
  accounts            Account[]
  categories          Category[]
  transactions        Transaction[]
  budgets             Budget[]
  clients             Client[]
  invoices            Invoice[]
}
```

### 5.3 Index Strategy

```sql
-- Transaction queries are always date-range filtered:
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);

-- Invoice list filtered by status frequently:
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);

-- Unbilled work log query:
CREATE INDEX idx_work_logs_billable ON work_logs(user_id, billable, billed_at)
  WHERE billable = true;
```

---

## 6. Key Data Flows

### 6.1 Creating and Sending an Invoice from Work Logs

```
User opens /finance/invoices/new
  → Selects Client
  → Clicks "Add from Work Logs"
      → addFromWorkLogsAction(invoiceId, workLogIds[], unitPrice)
          → line-item.service.ts: addLineItemsFromWorkLogs()
              → For each workLogId:
                  prisma.invoiceLineItem.create({ workLogId, description, quantity: hoursLogged, unitPrice, total })
                  prisma.workLog.update({ billedAt: null })   // marks as billed-pending (finalised on send)
  → User reviews line items, sets due date
  → User clicks "Send Invoice"
      → sendInvoiceAction(invoiceId)
          → invoice.service.ts: sendInvoice()
              → Compute & freeze subtotal, taxAmount, total on the invoice record
              → prisma.invoice.update({ status: SENT, sentAt: now(), subtotal, taxAmount, total })
              → For each lineItem with workLogId:
                  prisma.workLog.update({ billedAt: now() })
              → generateInvoicePdf(invoiceId) → Buffer
              → resend.emails.send({ to: client.email, attachment: pdfBuffer })
              → Return ActionResult<Invoice>
```

### 6.2 Account Balance Derivation

Account balance is never stored. It is always computed on read:

```
getAccountBalance(accountId):
  openingBalance = account.openingBalance
  income = SUM(transactions WHERE accountId AND type IN [INCOME, TRANSFER_IN])
  expenses = SUM(transactions WHERE accountId AND type IN [EXPENSE, TRANSFER_OUT])
  return openingBalance + income - expenses
```

For the Finance dashboard showing all account balances, this runs as a single aggregation query grouped by `accountId` — not N+1 per account.

### 6.3 Sending a Payment Reminder

```
User clicks "Send Reminder" on an OVERDUE invoice (list or detail view)
  → sendPaymentReminderAction(invoiceId)
      → invoice.service.ts: sendPaymentReminder()
          → Fetch invoice with client
          → Guard: status must be SENT and dueDate < now() (overdue)
          → Guard: client must have an email address
          → generateInvoicePdf(invoiceId) → Buffer
          → resend.emails.send({
              to: client.email,
              subject: `Payment reminder: Invoice ${invoice.invoiceNumber}`,
              text: polite reminder with invoice number, due date, total outstanding,
              attachment: { filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer }
            })
          → On success:
              prisma.invoice.update({
                reminderCount: { increment: 1 },
                lastReminderAt: new Date()
              })
          → On Resend failure: return ActionResult error; do NOT increment counter
          → revalidatePath('/finance/invoices')
          → Return ActionResult<{ reminderCount, lastReminderAt }>
```

Reminder count is only incremented on confirmed delivery. Failure surfaces as an `ActionResult` error string shown inline to the user.

### 6.5 Overdue Invoice Detection

`InvoiceStatus.OVERDUE` is **not stored** — it is derived at read time:

```typescript
function resolveInvoiceStatus(invoice: Invoice): InvoiceStatus | 'OVERDUE' {
  if (invoice.status === 'SENT' && invoice.dueDate && invoice.dueDate < new Date()) {
    return 'OVERDUE';
  }
  return invoice.status;
}
```

This runs in the service layer on every invoice read, requiring no scheduled job or status update.

### 6.6 Recurring Transaction Generation

On Finance dashboard load and on `/finance/transactions` page load:

```
transactionService.generateDueRecurrences(userId):
  → Query recurring transactions WHERE recurEndsAt IS NULL OR recurEndsAt >= today
  → For each: compute next due dates since last generated instance
  → For each due date in the past (up to today): create a new Transaction record with same fields
  → This is idempotent — check that no record already exists for that date in the series
```

---

## 7. API Design

### 7.1 Server Actions (Primary Mutation Path)

All CRUD mutations use Server Actions following the SAD-001 pattern. Return type is always `ActionResult<T>`:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

Finance Server Actions live in `lib/actions/finance/*.ts`. Each action:
1. Calls `getServerSession()` and enforces authentication.
2. Validates input with the corresponding Zod schema.
3. Calls the relevant service function.
4. Returns `ActionResult`.

### 7.2 Route Handlers (Read-Only Data & Binary Responses)

| Method | Path                                  | Purpose                                             |
|--------|---------------------------------------|-----------------------------------------------------|
| GET    | `/api/finance/invoices/[id]/pdf`      | Generate and stream invoice PDF (binary response).  |
| GET    | `/api/finance/reports/export`         | Export report data as CSV (query params: type, from, to). |

Both handlers authenticate via `getServerSession()` before processing.

### 7.3 Report Query Parameters

Report pages use URL search params for filter state (consistent with SAD-001 §9 URL-param state pattern):

```
/finance/reports?type=pnl&from=2026-04-01&to=2027-03-31&category=BUSINESS
/finance/reports?type=cashflow&from=2026-01-01&to=2026-12-31
/finance/reports?type=tax&year=2026-27
/finance/reports?type=unbilled
```

---

## 8. PDF Generation

### 8.1 Technology Choice

**`@react-pdf/renderer`** — renders React component trees to PDF using a subset of React and Yoga layout.

Rationale:
- Server-side only; no browser or Puppeteer required.
- Compatible with Vercel serverless functions (no binary headless browser).
- Component-based — invoice template is a React component, easy to maintain.
- Generates a `Buffer` directly, which is returned from the Route Handler as `application/pdf`.

### 8.2 Invoice PDF Template

The PDF template is a React component at `lib/pdf/InvoiceTemplate.tsx` (uses `@react-pdf/renderer` primitives — not standard HTML/CSS). It renders:

- Header: business name (from `user.businessName`), invoice number, issue/due date.
- Bill To: client name, address, email.
- Line items table: description, quantity, unit price, total.
- Totals section: subtotal, tax (label includes rate), **Total**.
- Footer: notes/payment terms, disclaimer.

The template receives a fully resolved `InvoiceWithLineItems` object — no DB calls inside the template.

### 8.3 Generation Flow

```
GET /api/finance/invoices/[id]/pdf
  → Authenticate session
  → invoiceService.getInvoiceById(id, userId)   // throws 404 if not found or not owned
  → invoiceService.generateInvoicePdf(invoice)
      → renderToBuffer(<InvoiceTemplate invoice={invoice} />)
      → returns Buffer
  → Response with headers:
      Content-Type: application/pdf
      Content-Disposition: attachment; filename="INV-2026-001.pdf"
```

---

## 9. Security Architecture

All SAD-001 §10 security controls apply. The following are Finance-specific additions.

### 9.1 Data Scoping

Every Prisma query in `lib/services/finance/` includes `userId` in the `where` clause. Services never accept a `userId` from the client — it is always taken from the validated server session.

Example pattern (enforced in code review):
```typescript
// ✅ Correct
prisma.invoice.findUnique({ where: { id, userId: session.user.id } })

// ❌ Rejected in review
prisma.invoice.findUnique({ where: { id } })
```

### 9.2 Monetary Integrity

- No `Float` columns for money in the Prisma schema — all amounts are `Int`.
- `@react-pdf/renderer` template formats minor units to locale string for display only; arithmetic is never performed on display strings.
- Invoice totals are frozen at send time and not recomputed on subsequent reads.

### 9.3 Invoice Status Transitions

Allowed transitions (enforced in `invoice.service.ts`):

```
DRAFT → SENT       (via sendInvoice)
DRAFT → CANCELLED  (via cancelInvoice)
SENT  → PAID       (via markPaid)
SENT  → DRAFT      (via revertToDraft — also reverts WorkLog.billedAt)
SENT  → CANCELLED  (via cancelInvoice — also reverts WorkLog.billedAt)
PAID  → (no transitions allowed)
CANCELLED → (no transitions allowed)
```

Any other transition is rejected with an `ActionResult` error.

---

## 10. Architecture Decision Records

### ADR-FIN-01: Finance as a module in the existing app, not a separate service

**Status:** Accepted

**Context:** Finance features could be built as a separate Next.js app or microservice.

**Decision:** Finance is implemented as a module within the existing *MyWork* Next.js application.

**Consequences:**
- (+) Work log entries can be queried and linked to invoice line items via a simple Prisma relation — no API call between services.
- (+) Single deployment, single DB, single auth session.
- (+) Shared sidebar, Tailwind design system, and component patterns.
- (-) Finance domain grows the application's codebase; mitigated by strict directory separation (`lib/services/finance/`, `lib/actions/finance/`, `app/(app)/finance/`).
- (-) A future decision to extract Finance into its own service will require migration work.

---

### ADR-FIN-02: Monetary values stored as integers (minor currency units)

**Status:** Accepted

**Context:** Storing money as `Float` or `Decimal` in PostgreSQL risks floating-point rounding errors. `Decimal` is precise but adds complexity in Prisma (returned as `Prisma.Decimal`, not `number`).

**Decision:** All monetary amounts are stored as `Int` representing the minor unit of the currency (pence, cents, etc.).

**Consequences:**
- (+) No floating-point errors; arithmetic on integers is exact.
- (+) Simple Prisma type (`Int` → `number` in TypeScript).
- (-) All display formatting must convert from minor units; a utility module (`lib/utils/money.ts`) is required.
- (-) Amounts must be validated as non-negative integers at the schema layer.

---

### ADR-FIN-03: Multi-currency deferred to v2; single user currency in v1

**Status:** Accepted

**Context:** Sole traders may have accounts in multiple currencies (e.g., USD client invoices, GBP personal account).

**Decision:** v1 supports a single currency per user, set in their profile. All accounts, transactions, and invoices use this currency.

**Consequences:**
- (+) Eliminates exchange rate complexity, FX storage, and cross-currency reporting in v1.
- (-) A user with multi-currency needs cannot use the Finance module fully until v2.
- Migration path: add `currency` field to Transaction and Account (already included in schema for future use), add `Currency` model with rates in v2.

---

### ADR-FIN-04: PDF generation via @react-pdf/renderer (server-side, no browser)

**Status:** Accepted

**Context:** Options for server-side PDF generation in Next.js / Vercel include:
1. `@react-pdf/renderer` — pure JS/React, no binary dependencies.
2. Puppeteer / Playwright — renders HTML in a headless browser; requires large binaries incompatible with Vercel function size limits.
3. `pdfkit` — imperative API; harder to maintain layout.
4. External PDF API (e.g., HTML/CSS to PDF SaaS) — adds external dependency and cost.

**Decision:** `@react-pdf/renderer` — runs in a Vercel serverless function with no binary dependencies.

**Consequences:**
- (+) Vercel-compatible with no extra configuration.
- (+) Invoice template is a React component — familiar pattern for the team.
- (-) `@react-pdf/renderer` uses its own layout primitives (`View`, `Text`, `Page`) — not standard HTML/CSS. Designers must work within these constraints.
- (-) Debugging PDF layout requires running the PDF renderer (no browser preview shortcut).

---

### ADR-FIN-05: Overdue invoice status is derived at read time, not stored

**Status:** Accepted

**Context:** Invoice `OVERDUE` could be set by a scheduled job (cron) or derived on read.

**Decision:** `OVERDUE` is derived: if `status = SENT` and `dueDate < now()`, the display status is `OVERDUE`. The stored status column remains `SENT`.

**Consequences:**
- (+) No scheduled job required; no infrastructure dependency.
- (+) Always accurate — reflects the current time on every read.
- (-) Cannot query `WHERE status = 'OVERDUE'` directly in Prisma. Overdue invoice counts on the dashboard use: `WHERE status = SENT AND dueDate < now()`.

---

### ADR-FIN-06: Recurring transaction generation is triggered on page load, not via cron

**Status:** Accepted

**Context:** Recurring transactions could be generated by: (a) a scheduled cron job, (b) a queue/worker, or (c) on-demand when the user loads a finance page.

**Decision:** On-demand generation, triggered when the user loads `/finance/transactions` or `/finance/` (dashboard). The generation function is idempotent — it checks for existing records before inserting.

**Consequences:**
- (+) No cron job, no queue, no additional infrastructure.
- (+) Vercel-compatible without Edge Cron (a paid feature).
- (-) If a user does not log in, recurring transactions are not generated. This is acceptable for a personal finance tool — the data is only needed when the user is present.
- (-) A sudden burst of missed recurring transactions (e.g., user returns after 3 months) generates many DB writes on first load. Acceptable given the low frequency; the function is capped to generate no more than 366 instances per recurrence per call.

---

## 11. Glossary

All terms from BRD-002 §11 apply. Additional technical terms:

| Term              | Definition                                                                                           |
|-------------------|------------------------------------------------------------------------------------------------------|
| Minor Unit        | The smallest unit of a currency; e.g., 1 pence (GBP), 1 cent (USD, AUD). All monetary integers use this unit. |
| Derived Balance   | An account balance computed from transactions at read time; never stored as a column.                |
| Frozen Total      | An invoice's subtotal, taxAmount, and total are computed and saved at `SENT` time; they do not change thereafter. |
| ActionResult<T>   | The standard server action return type from SAD-001: `{ success: true; data: T } | { success: false; error: string }`. |

---

## 12. Change Log

| Version | Date       | Author             | Summary          |
|---------|------------|--------------------|------------------|
| 1.0     | 2026-03-06 | Architecture Team  | Initial release.                                                                                                                   |
| 1.1     | 2026-03-06 | Tech Lead          | Added §3.0 Module Access Gate; updated User model extension to include `moduleWork`/`moduleFinance` flags; cross-referenced SAD-001 §10.3.0.                      |
| 1.2     | 2026-03-06 | Tech Lead          | Added `reminderCount`/`lastReminderAt` to Invoice model; added `sendPaymentReminder` to invoice service and `sendPaymentReminderAction` to server actions; added §6.3 payment reminder data flow; renumbered §6.4–6.6. |

---

*End of Document — SAD-002 v1.2*
