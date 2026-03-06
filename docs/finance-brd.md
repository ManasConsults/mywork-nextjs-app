# Business Requirements Document (BRD)

## Finance Module — *MyWork*

| Field         | Value                          |
|---------------|-------------------------------|
| Document ID   | BRD-002                        |
| Version       | 1.2                            |
| Status        | Draft                          |
| Author        | Business Analysis Team         |
| Date          | 2026-03-06                     |
| Related BRD   | BRD-001 v1.2 (Work Management) |
| Reviewers     | Product Owner, Tech Lead, QA   |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Objectives](#2-business-objectives)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Scope](#4-scope)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 [Account Management](#51-account-management)
   - 5.2 [Transaction Tracking](#52-transaction-tracking)
   - 5.3 [Categories](#53-categories)
   - 5.4 [Budgets](#54-budgets)
   - 5.5 [Clients](#55-clients)
   - 5.6 [Invoicing](#56-invoicing)
   - 5.7 [Timesheet Billing](#57-timesheet-billing)
   - 5.8 [Reports](#58-reports)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Assumptions](#7-assumptions)
8. [Constraints](#8-constraints)
9. [Dependencies](#9-dependencies)
10. [Success Metrics](#10-success-metrics)
11. [Glossary](#11-glossary)
12. [Change Log](#12-change-log)

---

## 1. Executive Summary

### 1.1 Purpose

The Finance module extends *MyWork* with personal and business financial management capabilities for individuals — with a specific focus on sole traders who operate both a personal budget and a freelance or self-employed business. The module enables users to track income and expenses across personal, work-related, and business categories; manage client relationships; raise and send invoices; and convert work log entries into billable invoice line items.

### 1.2 Problem Statement

A sole trader managing both personal and professional finances today relies on a patchwork of tools: a spreadsheet for expenses, a separate invoicing app, a time-tracking tool, and a banking app. This fragmentation causes:

- Effort logged in a work management tool cannot be directly converted into client invoices without manual re-entry.
- Personal, work-related (e.g., home office, equipment), and business expenses are mixed without clear categorisation, complicating tax preparation.
- There is no consolidated view of cash flow across personal and business accounts.
- Invoices are raised from memory rather than from verified work log data, leading to under-billing.

### 1.3 Proposed Solution

A Finance module integrated directly into *MyWork* that:

- Tracks transactions across personal and business accounts with clear category typing (Personal / Work-Related / Business).
- Allows sole traders to raise invoices against clients with line items auto-populated from work log entries (timesheets).
- Provides budget tracking per category and period.
- Delivers consolidated financial reports suitable for self-assessment tax preparation.

### 1.4 Strategic Alignment

This module extends *MyWork*'s value proposition from work organisation alone to a unified productivity and financial workspace for the individual professional. The key differentiator is the tight integration between the existing Work Log module and invoice generation — eliminating double data entry for sole traders.

---

## 2. Business Objectives

| ID   | Objective                                                                                              | Priority |
|------|--------------------------------------------------------------------------------------------------------|----------|
| BO-1 | Enable individuals to track all personal and business financial transactions in one place.             | High     |
| BO-2 | Eliminate manual timesheet-to-invoice re-entry by connecting work logs directly to invoice line items. | High     |
| BO-3 | Provide clear separation of personal, work-related, and business expenses for tax purposes.            | High     |
| BO-4 | Enable sole traders to raise, send, and track client invoices without a separate tool.                 | High     |
| BO-5 | Deliver budget-vs-actual visibility to help individuals control personal and business spending.        | Medium   |
| BO-6 | Generate financial reports sufficient for sole trader self-assessment tax preparation.                 | Medium   |

---

## 3. Stakeholder Analysis

### 3.1 Stakeholder Register

| Stakeholder               | Role           | Interest                                                                    | Influence | Engagement Strategy          |
|---------------------------|----------------|-----------------------------------------------------------------------------|-----------|------------------------------|
| Individual / Sole Trader  | Primary User   | Manage personal and business finances; invoice clients; control budget.     | High      | Co-design, beta testing      |
| Accountant / Bookkeeper   | Indirect User  | Access clean transaction exports for tax filing; verify invoice records.    | Medium    | Stakeholder interviews       |
| Clients (of the sole trader) | External    | Receive professional invoices; pay on time.                                 | Low       | Invoice email UX review      |
| Product Owner             | Decision Maker | Scope, prioritisation, delivery acceptance.                                 | High      | Sprint reviews               |
| Engineering Team          | Builders       | Technical feasibility and implementation quality.                           | High      | Architecture reviews         |

### 3.2 User Personas

#### Persona D — Sole Trader / Freelancer (Primary for Finance)
- **Name:** Morgan
- **Role:** Independent Consultant / Freelancer
- **Goals:** Know where money is going (personal vs business); raise accurate client invoices from logged hours; prepare tax returns without an accountant; stay within monthly budgets.
- **Pain Points:** Spends 2–3 hours at month-end reconciling time tracking, invoices, and bank statements across three different tools. Regularly under-bills because they forget to log all hours.

#### Persona A — Individual Contributor (from BRD-001, secondary for Finance)
- **Name:** Alex
- **Role:** Employed professional
- **Goals:** Track personal and work-related expenses (e.g., home office, travel); set monthly budgets; see a simple financial picture.
- **Pain Points:** Uses a spreadsheet that quickly becomes unwieldy; no way to separate personal spending from work-related costs.

---

## 4. Scope

### 4.0 Module Access Prerequisite

Access to the Finance module is gated by a **module license** controlled by the Admin (see BRD-001 FR-UG-05). All users have Finance access enabled by default. If an Admin disables a user's Finance license, all `/finance/*` routes become inaccessible and the Finance section of the sidebar is hidden. This is enforced at the server-side session layer, not the client.

### 4.1 In Scope (v1.0)

- Account management (bank accounts, cash, credit, savings — personal and business).
- Transaction recording: income, expense, and transfer entries.
- Three-tier category typing: Personal / Work-Related / Business.
- User-defined categories and subcategories.
- Monthly and annual budget setting per category.
- Client management for invoicing.
- Invoice creation, editing, and status tracking (Draft / Sent / Paid / Overdue / Cancelled).
- Invoice line items manually entered or auto-populated from Work Log entries.
- Hourly rate configuration per client and as a global default.
- PDF invoice generation (server-side).
- Invoice email delivery via Resend.
- Timesheet view: work log hours filtered by date range and billed/unbilled status.
- Financial reports: P&L by period, cash flow by period, expense breakdown by category, tax summary, unbilled hours.
- Single currency per user (configurable in profile).

### 4.2 Out of Scope (v1.0)

- Multi-currency accounts and exchange rate conversion — planned for v2.
- Bank feed / Open Banking integrations (automatic transaction import) — planned for v2.
- Receipt image capture and OCR — planned for v2.
- Payroll management.
- VAT / GST return filing (data is available; submission to HMRC/ATO/IRS is out of scope).
- Inventory / stock management.
- Accounts payable / purchase orders.
- Double-entry bookkeeping interface (transactions use a simplified model).
- Native mobile application.
- Client portal (clients cannot log into the app).

---

## 5. Functional Requirements

> **Notation:** Each user story follows the format:
> *"As a [persona], I want to [action] so that [benefit]."*
> Acceptance criteria are numbered per story and prefixed with **AC**.

---

### 5.1 Account Management

**Overview:** Accounts represent the financial accounts a user holds. Transactions are always associated with an account.

---

#### FR-FIN-01 — Create and Manage Accounts

**User Story:**
As a user, I want to create and manage my financial accounts so that I can track the balance of each account separately.

**Acceptance Criteria:**
- AC-FIN-01-1: An account requires: Name (max 100 chars) and Type. Type options are: `Checking`, `Savings`, `Cash`, `Credit`, `Investment`.
- AC-FIN-01-2: Optional fields: Description, Opening Balance (defaults to 0), Is Default (boolean — one default account per user).
- AC-FIN-01-3: Account ownership is scoped to the authenticated user; accounts are private.
- AC-FIN-01-4: Account current balance is calculated from the opening balance plus all recorded transactions; it is never stored as a mutable field (derived value).
- AC-FIN-01-5: Users can edit the account name, description, and type.
- AC-FIN-01-6: Deleting an account requires a confirmation dialog. An account with recorded transactions cannot be deleted; it can only be archived (soft-delete).
- AC-FIN-01-7: Archived accounts are hidden from active views but their transactions remain in reports.

---

### 5.2 Transaction Tracking

**Overview:** Transactions are the core financial record. Each transaction is either an income (positive) or expense (negative) entry against an account, or a transfer between two accounts.

---

#### FR-FIN-02 — Record a Transaction

**User Story:**
As a user, I want to record income and expense transactions so that I have a complete record of my financial activity.

**Acceptance Criteria:**
- AC-FIN-02-1: A transaction requires: Account, Amount (positive decimal, up to 2 decimal places), Type (`Income` / `Expense`), Date, and Category.
- AC-FIN-02-2: Optional fields: Description (max 500 chars), Reference (e.g., cheque number, payment reference), Tags.
- AC-FIN-02-3: A `Transfer` type moves money between two accounts owned by the user. It requires a source Account and a destination Account and creates two linked transaction records.
- AC-FIN-02-4: Amounts are displayed in the user's configured currency with correct formatting.
- AC-FIN-02-5: The transaction list for an account is sorted by Date descending by default.
- AC-FIN-02-6: Transactions can be filtered by: Date Range, Type, Category, Account, Amount range.

---

#### FR-FIN-03 — Edit and Delete Transactions

**User Story:**
As a user, I want to edit or delete a recorded transaction so that I can correct mistakes.

**Acceptance Criteria:**
- AC-FIN-03-1: All fields of a transaction are editable.
- AC-FIN-03-2: Deleting a transaction requires a confirmation prompt.
- AC-FIN-03-3: A transaction linked to an Invoice Line Item cannot be deleted; the link must be removed first.
- AC-FIN-03-4: An `updatedAt` timestamp is recorded on every edit.

---

#### FR-FIN-04 — Recurring Transactions

**User Story:**
As a user, I want to mark a transaction as recurring so that regular income and expenses can be tracked without re-entry.

**Acceptance Criteria:**
- AC-FIN-04-1: A transaction can be set as recurring with a frequency: `Weekly`, `Fortnightly`, `Monthly`, `Quarterly`, `Annually`.
- AC-FIN-04-2: The recurring series has an optional end date.
- AC-FIN-04-3: A recurring transaction generates a new record on each due date. Generation is triggered on next user login or dashboard load for due dates that have passed.
- AC-FIN-04-4: Users can edit or cancel the recurring series at any time.

---

### 5.3 Categories

**Overview:** Categories allow transactions to be classified for budgeting and reporting. Categories have a type that determines their tax relevance.

---

#### FR-FIN-05 — Manage Categories

**User Story:**
As a user, I want to create and organise my own transaction categories so that my financial data is meaningful to me.

**Acceptance Criteria:**
- AC-FIN-05-1: A category requires: Name (max 100 chars) and Type. Type options are: `Personal`, `Work-Related`, `Business`.
- AC-FIN-05-2: Optional fields: Parent Category (for subcategories, one level deep only), Colour, Icon.
- AC-FIN-05-3: **Personal** — everyday personal spending (groceries, entertainment, rent). Not deductible for tax.
- AC-FIN-05-4: **Work-Related** — expenses incurred because of employment but not purely business (home office proportion, work travel, professional subscriptions). Partially or fully deductible depending on jurisdiction — flag for reporting only; the application does not calculate deductibility.
- AC-FIN-05-5: **Business** — sole trader business expenses and income (client invoices, professional fees, equipment used exclusively for business). Flagged as business for P&L and tax reporting.
- AC-FIN-05-6: A default set of categories is provided on first use (user can edit or delete any of them).
- AC-FIN-05-7: Deleting a category with existing transactions is blocked; the user must re-categorise those transactions first.

---

### 5.4 Budgets

**Overview:** Budgets allow users to set spending limits per category and period, and track actual spend against them.

---

#### FR-FIN-06 — Set a Budget

**User Story:**
As a user, I want to set a budget for a category so that I can track whether I am staying within my spending limits.

**Acceptance Criteria:**
- AC-FIN-06-1: A budget requires: Category, Amount, and Period (`Monthly` / `Annual`).
- AC-FIN-06-2: Only one active budget per category per period is allowed at a time.
- AC-FIN-06-3: Budget progress (actual spend vs budget amount) is visible on the budgets overview page.
- AC-FIN-06-4: A progress indicator (e.g., progress bar) shows the percentage of budget used for the current period.
- AC-FIN-06-5: Budgets that have been exceeded are visually highlighted.
- AC-FIN-06-6: Budget history (past periods' actual vs budget) is retained and viewable.

---

### 5.5 Clients

**Overview:** Clients are the entities that the sole trader invoices. Client records store contact and billing defaults.

---

#### FR-FIN-07 — Manage Clients

**User Story:**
As a sole trader, I want to maintain a list of clients so that I can quickly raise invoices and track what each client owes me.

**Acceptance Criteria:**
- AC-FIN-07-1: A client requires: Name (max 200 chars).
- AC-FIN-07-2: Optional fields: Email, Phone, Address (multi-line), Default Hourly Rate, Currency (defaults to user's configured currency), Notes (max 1000 chars).
- AC-FIN-07-3: The client list shows each client's name, total invoiced amount (all time), and total outstanding (unpaid invoices).
- AC-FIN-07-4: A client can be archived; archived clients are hidden from the active list but their invoices remain accessible.
- AC-FIN-07-5: A client cannot be permanently deleted if they have associated invoices.

---

### 5.6 Invoicing

**Overview:** Invoices allow sole traders to bill clients for work done. An invoice contains one or more line items, each representing a service, product, or logged work entry.

---

#### FR-FIN-08 — Create an Invoice

**User Story:**
As a sole trader, I want to create a client invoice so that I can formally request payment for work completed.

**Acceptance Criteria:**
- AC-FIN-08-1: An invoice requires: Client, Issue Date.
- AC-FIN-08-2: Optional fields: Invoice Number (auto-generated if not provided, format `INV-YYYY-NNN`), Due Date, Notes / Terms, Tax Rate (percentage, applied to subtotal).
- AC-FIN-08-3: An invoice must contain at least one Line Item before it can be sent. Line items are described in FR-FIN-09 and FR-FIN-10.
- AC-FIN-08-4: Invoice status lifecycle: `Draft` → `Sent` → `Paid`. Additional terminal states: `Overdue` (system-computed when Due Date has passed and status is `Sent`), `Cancelled`.
- AC-FIN-08-5: Subtotal, tax amount, and total are computed from line items and the invoice tax rate.
- AC-FIN-08-6: An invoice can be duplicated; the duplicate is created in `Draft` status with a new invoice number.
- AC-FIN-08-7: Marking an invoice as `Paid` records the payment date and optionally links to a transaction in the user's accounts.

---

#### FR-FIN-09 — Add Manual Invoice Line Items

**User Story:**
As a sole trader, I want to add line items to an invoice manually so that I can bill for any service or expense.

**Acceptance Criteria:**
- AC-FIN-09-1: A line item requires: Description (max 500 chars), Quantity (positive decimal), Unit Price.
- AC-FIN-09-2: Line item total = Quantity × Unit Price.
- AC-FIN-09-3: Line items can be reordered within an invoice.
- AC-FIN-09-4: Line items can be edited or deleted from a `Draft` invoice. A `Sent` invoice can only have line items edited if it is reverted to `Draft`.

---

#### FR-FIN-10 — Generate Invoice Lines from Work Logs (Timesheet Billing)

**User Story:**
As a sole trader, I want to select my work log entries and add them as invoice line items so that I can bill accurately for every hour worked without re-entering data.

*(See also §5.7 for full timesheet billing requirements.)*

**Acceptance Criteria:**
- AC-FIN-10-1: When adding line items to a `Draft` invoice, a "Add from Work Logs" action opens a timesheet selector.
- AC-FIN-10-2: The timesheet selector shows all unbilled work log entries for the invoice's client (matched via task tags or client assignment — see §5.7), filterable by Date Range.
- AC-FIN-10-3: Each selected work log entry creates one invoice line item: Description = Work Log description, Quantity = hours logged, Unit Price = client's default hourly rate (editable before saving).
- AC-FIN-10-4: Work log entries added to an invoice are marked as `Billed` and no longer appear in the unbilled timesheet view.
- AC-FIN-10-5: If an invoice is cancelled or reverted to `Draft`, billed work log entries are reverted to `Unbilled`.

---

#### FR-FIN-11 — Invoice PDF and Email Delivery

**User Story:**
As a sole trader, I want to generate a PDF invoice and send it to my client by email so that I can receive payment promptly.

**Acceptance Criteria:**
- AC-FIN-11-1: A PDF can be generated for any invoice in `Draft` or `Sent` status.
- AC-FIN-11-2: The PDF includes: user's name/business name (from profile), client name and address, invoice number, issue date, due date, line items table, subtotal, tax amount, total, and payment terms/notes.
- AC-FIN-11-3: "Send Invoice" action transitions the invoice from `Draft` to `Sent` and emails the PDF attachment to the client's email address using Resend.
- AC-FIN-11-4: Sending is blocked if the client has no email address; the user is prompted to add one.
- AC-FIN-11-5: Email delivery failure is surfaced to the user but does not revert the invoice status; the user can retry or download the PDF and send manually.
- AC-FIN-11-6: A "Download PDF" option is available at all times without sending.

---

### 5.7 Timesheet Billing

**Overview:** Timesheet billing bridges the Work Log module and Invoicing. Work log entries can be flagged as billable to a client, and their billed/unbilled status is tracked.

---

#### FR-FIN-12 — Billable Work Log Entries

**User Story:**
As a sole trader, I want to mark work log entries as billable to a specific client so that I can accurately track what has and has not been invoiced.

**Acceptance Criteria:**
- AC-FIN-12-1: A Work Log entry gains two optional fields: Billable (boolean, defaults to `false`) and Client (link to a Client record).
- AC-FIN-12-2: When a work log entry is billable, it is visible in the timesheet selector during invoice creation (FR-FIN-10).
- AC-FIN-12-3: A work log entry has a billing status: `Unbilled` (billable but not yet on an invoice), `Billed` (added to a `Sent` or `Paid` invoice), `Not Billable`.
- AC-FIN-12-4: The billing status is visible on the work log entry detail and the consolidated work log list.

---

#### FR-FIN-13 — Timesheet View

**User Story:**
As a sole trader, I want a dedicated timesheet view so that I can see all my billable hours and identify what is outstanding.

**Acceptance Criteria:**
- AC-FIN-13-1: The timesheet view lists all work log entries where `billable = true`, grouped by Client.
- AC-FIN-13-2: Filters available: Client, Date Range, Billing Status (Unbilled / Billed / All).
- AC-FIN-13-3: Summary row per client: total hours unbilled, total hours billed, total unbilled value (hours × client rate).
- AC-FIN-13-4: A "Create Invoice" shortcut from the timesheet view pre-populates a new invoice with the selected client and all unbilled entries.

---

### 5.8 Reports

**Overview:** Reports provide financial summaries for budgeting, business performance review, and tax preparation.

---

#### FR-FIN-14 — Profit & Loss Report

**User Story:**
As a user, I want a profit and loss report so that I can understand my income and expenditure over a period.

**Acceptance Criteria:**
- AC-FIN-14-1: Report inputs: Date Range (defaults to current calendar month), Category Type filter (Personal / Work-Related / Business / All).
- AC-FIN-14-2: Report shows: Total Income, Total Expenses, Net Profit/Loss, broken down by category.
- AC-FIN-14-3: Comparison to the previous equivalent period (e.g., previous month) is shown as variance.
- AC-FIN-14-4: Report is exportable as CSV.

---

#### FR-FIN-15 — Cash Flow Report

**User Story:**
As a user, I want a cash flow report so that I can see how money moved in and out of my accounts over time.

**Acceptance Criteria:**
- AC-FIN-15-1: Report shows monthly income vs expenses as a bar/line chart (date range: up to 12 months).
- AC-FIN-15-2: Opening and closing balance per month are shown per account or across all accounts.
- AC-FIN-15-3: Report is exportable as CSV.

---

#### FR-FIN-16 — Tax Summary Report

**User Story:**
As a sole trader, I want a tax summary report so that I have all the information needed for my self-assessment tax return.

**Acceptance Criteria:**
- AC-FIN-16-1: Report inputs: Tax Year (configurable start month — e.g., April for UK, July for Australia).
- AC-FIN-16-2: Report shows:
  - Business income (total invoiced and total received/paid).
  - Business expenses by category (type = `Business`).
  - Work-related expenses by category (type = `Work-Related`) — flagged as "review for deductibility."
  - Net business profit (Business Income − Business Expenses).
- AC-FIN-16-3: Report is exportable as PDF and CSV.
- AC-FIN-16-4: A disclaimer is displayed: *"This report is for reference only. Consult a tax professional to confirm deductibility of expenses."*

---

#### FR-FIN-17 — Unbilled Hours Report

**User Story:**
As a sole trader, I want to see all unbilled hours across clients so that I never miss billing for work done.

**Acceptance Criteria:**
- AC-FIN-17-1: Report shows all unbilled, billable work log entries grouped by Client.
- AC-FIN-17-2: Each row shows: Client Name, Date, Work Log Description, Hours, Rate, Estimated Value.
- AC-FIN-17-3: Grand total of unbilled hours and estimated revenue is shown at the bottom.

---

#### FR-FIN-18 — Manual Payment Reminder

**User Story:**
As a sole trader, I want to manually send a payment reminder to a client for an overdue invoice so that I can chase payment without leaving the app.

**Acceptance Criteria:**
- AC-FIN-18-1: A "Send Reminder" action is available on any invoice with a derived status of `OVERDUE` (i.e., `status = SENT` and `dueDate < today`).
- AC-FIN-18-2: Triggering the action sends an email to the client's email address via Resend. The email includes: a polite reminder message, the invoice number, the original issue date, the due date, the total amount outstanding, and the original invoice PDF as an attachment.
- AC-FIN-18-3: Sending a reminder is blocked if the client has no email address; the user is prompted to add one before proceeding.
- AC-FIN-18-4: The invoice detail page records when the most recent reminder was sent (`Last reminder sent: <date>`) and how many reminders have been sent in total.
- AC-FIN-18-5: Email delivery failure is surfaced to the user with an error message. A failed send does not increment the reminder count.
- AC-FIN-18-6: There is no automatic/scheduled reminder; all reminders are triggered manually by the user.
- AC-FIN-18-7: A "Send Reminder" button is also available from the invoice list view for any overdue row, without requiring the user to open the invoice detail.

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-FP1  | Finance dashboard and report pages load within 2.5 seconds (LCP) on standard broadband.       |
| NFR-FP2  | Transaction list with up to 5,000 records per user renders within 500ms.                       |
| NFR-FP3  | PDF invoice generation completes within 3 seconds server-side.                                |

### 6.2 Security

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-FS1  | All financial data (accounts, transactions, invoices) is strictly scoped to the authenticated user; no cross-user data leakage is permissible. |
| NFR-FS2  | Monetary amounts stored as integers (smallest currency unit, e.g., pence/cents) — no floating point storage. |
| NFR-FS3  | All existing security NFRs from BRD-001 §6.3 apply to the Finance module.                    |

### 6.3 Data Integrity

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-FD1  | Account balance is always derived from transactions; it is never stored as a mutable column.  |
| NFR-FD2  | Invoice totals (subtotal, tax, total) are stored as computed-and-frozen values at the time of sending; subsequent transaction or rate changes do not alter sent invoices. |
| NFR-FD3  | Work log entries marked as `Billed` cannot be deleted without first unlinking from the invoice. |
| NFR-FD4  | Soft-delete applied to Accounts and Clients; hard-delete blocked if referencing records exist. |

### 6.4 Usability

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-FU1  | Invoice creation (from selecting work logs to sending) completable in ≤ 5 clicks.             |
| NFR-FU2  | All finance views are responsive (desktop ≥ 1024px, tablet 768–1023px, mobile ≤ 767px).      |
| NFR-FU3  | WCAG 2.1 AA accessibility compliance on all Finance module pages.                             |

---

## 7. Assumptions

| ID   | Assumption                                                                                              |
|------|---------------------------------------------------------------------------------------------------------|
| A-F1 | A single currency is configured per user in their profile; multi-currency is not supported in v1.0.    |
| A-F2 | Tax rate on invoices is a simple percentage applied to the subtotal (e.g., 20% VAT, 10% GST). Complex tax rules (e.g., line-item tax, tax-exempt items) are out of scope. |
| A-F3 | The application does not submit data to any tax authority; reports are for the user's own reference only. |
| A-F4 | Clients are managed within the app; there is no integration with a CRM in v1.0.                        |
| A-F5 | All users of the Finance module are sole traders or individuals; multi-user business finance (shared P&L, multi-director) is out of scope. |
| A-F6 | Work log hours are entered as decimal hours (e.g., 1.5 hours); conversion from hours:minutes is handled in the UI. |
| A-F7 | Invoice PDF layout uses a fixed template; custom branding (logo, colours) is planned for v2.           |
| A-F8 | Finance module access is enabled by default for all users. Access can be revoked by an Admin via the module licensing feature (BRD-001 FR-UG-05). A user without Finance access cannot reach any Finance route or see the Finance section of the sidebar. |

---

## 8. Constraints

| ID   | Constraint                                                                                             |
|------|--------------------------------------------------------------------------------------------------------|
| C-F1 | Same technology stack as BRD-001 §8: Next.js 15, TypeScript, Tailwind, Prisma + PostgreSQL, Vercel.  |
| C-F2 | Invoice email delivery uses Resend (already integrated); no additional email provider.                 |
| C-F3 | PDF generation must be server-side (no client-side PDF libraries); must be compatible with Vercel serverless functions. |
| C-F4 | No bank feed integrations in v1.0 (no Open Banking, no Plaid, no Basiq).                              |
| C-F5 | GDPR compliance applies to all financial data — financial records are sensitive personal data.         |

---

## 9. Dependencies

| ID   | Dependency                          | Type     | Notes                                                                            |
|------|-------------------------------------|----------|----------------------------------------------------------------------------------|
| D-F1 | BRD-001 Work Log module             | Internal | Work log entries must support `billable` flag and `clientId` before FR-FIN-12 can be built. |
| D-F2 | Resend (email service)              | External | Already active in v1.0 for auth emails; reused for invoice delivery.            |
| D-F3 | PDF generation library              | Internal | `@react-pdf/renderer` — see SAD-002 ADR-FIN-04.                                 |
| D-F4 | User profile: currency setting      | Internal | User must be able to configure their currency in the profile page.              |

---

## 10. Success Metrics

### 10.1 Feature Adoption

| Metric                                             | Target                                              |
|----------------------------------------------------|-----------------------------------------------------|
| Finance module activation rate                      | ≥ 60% of active MyWork users create at least 1 account within 30 days of release |
| Invoice creation rate (sole trader users)          | ≥ 1 invoice per active sole trader per month        |
| Work-log-to-invoice conversion usage               | ≥ 50% of invoices contain at least 1 line item from a work log |

### 10.2 Quality Metrics

| Metric                              | Target                              |
|-------------------------------------|-------------------------------------|
| PDF generation success rate         | ≥ 99.5%                             |
| Invoice email delivery success rate | ≥ 98% (via Resend delivery reports) |
| Data integrity: balance accuracy    | 100% — no discrepancy between derived and displayed balances |

---

## 11. Glossary

| Term              | Definition                                                                                              |
|-------------------|---------------------------------------------------------------------------------------------------------|
| Account           | A financial account (bank, cash, credit, etc.) that holds a balance and records transactions.           |
| Transaction       | A single income, expense, or transfer record against an account.                                        |
| Category          | A user-defined classification for transactions; typed as Personal, Work-Related, or Business.           |
| Work-Related      | Expenses incurred due to employment or self-employment but not exclusively business (e.g., home office). |
| Business          | Expenses and income directly attributable to sole trader business operations.                           |
| Budget            | A user-defined spending limit for a category over a defined period.                                     |
| Client            | An entity to whom the sole trader provides services and raises invoices.                                 |
| Invoice           | A formal request for payment issued to a client, containing one or more line items.                     |
| Invoice Line Item | A single billable row on an invoice, optionally linked to a Work Log entry.                             |
| Sole Trader       | A self-employed individual who is the sole owner of their business.                                     |
| Timesheet         | A consolidated view of billable work log entries, grouped by client, for invoice generation.            |
| Billed            | A work log entry that has been added to a sent or paid invoice.                                         |
| Unbilled          | A billable work log entry not yet included in any invoice.                                              |
| P&L               | Profit and Loss — a financial statement summarising income and expenses over a period.                  |
| Tax Year          | A 12-month period for which tax is calculated; start month is user-configurable by jurisdiction.        |

---

## 12. Change Log

| Version | Date       | Author                 | Summary          |
|---------|------------|------------------------|------------------|
| 1.0     | 2026-03-06 | Business Analysis Team | Initial release.                                                                                                                  |
| 1.1     | 2026-03-06 | Tech Lead              | Added §4.0 Module Access Prerequisite; added A-F8 module licensing reference; updated version to 1.1.  |
| 1.2     | 2026-03-06 | Tech Lead              | Added FR-FIN-18 Manual Payment Reminder (manual overdue reminder email with PDF attachment, reminder count tracking). |

---

*End of Document — BRD-002 v1.2*
