# Business Requirements Document (BRD)

## Work Management Application — *MyWork*

| Field         | Value                          |
|---------------|-------------------------------|
| Document ID   | BRD-001                        |
| Version       | 1.0                            |
| Status        | Draft                          |
| Author        | Business Analysis Team         |
| Date          | 2026-02-24                     |
| Reviewers     | Product Owner, Tech Lead, QA   |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Objectives](#2-business-objectives)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Scope](#4-scope)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 [Task Management](#51-task-management)
   - 5.2 [Work Log](#52-work-log)
   - 5.3 [Achievements](#53-achievements)
   - 5.4 [Notes](#54-notes)
   - 5.5 [Daily To-Do Items](#55-daily-to-do-items)
   - 5.6 [Global Search](#56-global-search)
   - 5.7 [User & Group Management](#57-user--group-management)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Assumptions](#7-assumptions)
8. [Constraints](#8-constraints)
9. [Dependencies](#9-dependencies)
10. [Success Metrics](#10-success-metrics)
11. [Glossary](#11-glossary)

---

## 1. Executive Summary

### 1.1 Purpose

*MyWork* is a personal and team work management application designed to help employees organise their professional life in one unified workspace. Employees can capture tasks they are working on, log time and effort against those tasks, record achievements for yearly performance reviews, write contextual notes, and plan their daily to-do list. Administrators can manage users and groups to control access and visibility.

### 1.2 Problem Statement

Knowledge workers currently maintain their work-related information across disparate tools — email, spreadsheets, sticky notes, and generic project management platforms. This fragmentation causes:

- Loss of context between tasks and the effort spent on them.
- Inability to quickly surface relevant past work during performance review cycles.
- No single searchable repository for notes, logs, and accomplishments.
- Poor daily planning discipline due to disconnected to-do lists.

### 1.3 Proposed Solution

A lightweight, elegant, web-based application that centralises five core modules — **Tasks**, **Work Logs**, **Achievements**, **Notes**, and **Daily To-Do** — linked by a powerful global search and governed by simple user/group administration.

### 1.4 Strategic Alignment

The application aligns with the organisation's goals of improving employee productivity, reducing tool sprawl, and providing structured data for performance management processes.

---

## 2. Business Objectives

| ID   | Objective                                                                                   | Priority |
|------|---------------------------------------------------------------------------------------------|----------|
| BO-1 | Provide a single source of truth for all employee work-related information.                  | High     |
| BO-2 | Reduce time spent compiling performance review material by at least 50%.                     | High     |
| BO-3 | Enable employees to plan and execute daily work through integrated to-do lists.               | High     |
| BO-4 | Allow managers to gain visibility into team activity through group structures.                | Medium   |
| BO-5 | Deliver a simple, low-friction user experience requiring minimal onboarding.                  | High     |
| BO-6 | Ensure all data is searchable across every module with sub-second response times.             | Medium   |

---

## 3. Stakeholder Analysis

### 3.1 Stakeholder Register

| Stakeholder          | Role                  | Interest                                                          | Influence | Engagement Strategy |
|----------------------|-----------------------|-------------------------------------------------------------------|-----------|---------------------|
| Employee (End User)  | Primary User          | Capture, organise, and retrieve daily work information.           | High      | Co-design sessions, beta testing |
| Team Manager         | Secondary User / Admin| Visibility into team work; group management.                      | High      | Requirements workshops |
| HR / People Ops      | Indirect Beneficiary  | Access to achievement data for review cycles.                     | Medium    | Stakeholder interviews |
| IT / Platform Admin  | System Administrator  | User provisioning, security, system maintenance.                  | Medium    | Technical review sessions |
| Product Owner        | Decision Maker        | Scope, prioritisation, and delivery acceptance.                   | High      | Sprint reviews |
| Engineering Team     | Builders              | Technical feasibility and implementation quality.                 | High      | Sprint planning, architecture reviews |

### 3.2 User Personas

#### Persona A — Individual Contributor (Primary)
- **Name:** Alex
- **Role:** Software Engineer
- **Goals:** Capture tasks quickly, log work so nothing is forgotten, keep daily focus via a to-do list, compile achievements painlessly for annual reviews.
- **Pain Points:** Switches between five different tools; forgets what was done last quarter; loses notes in email threads.

#### Persona B — Team Lead / Manager
- **Name:** Sam
- **Role:** Engineering Manager
- **Goals:** Know what the team is working on; manage user access; review team achievements before calibration sessions.
- **Pain Points:** Manually collects status updates; no unified view of team progress.

#### Persona C — System Administrator
- **Name:** Jordan
- **Role:** IT Admin
- **Goals:** Provision users, assign roles, manage groups, maintain system health.
- **Pain Points:** Fragmented user management across multiple tools.

---

## 4. Scope

### 4.1 In Scope

- Task creation, tracking, and management.
- Work log entries associated with tasks.
- Achievement capture and categorisation.
- General and task-specific notes.
- Daily to-do items (optionally linked to tasks).
- Global full-text search across all modules.
- User management (create, edit, deactivate users).
- Group management (create groups, assign members, set group visibility).
- Role-based access control (Admin, Manager, Member).
- Email-based authentication.
- Responsive web interface.

### 4.2 Out of Scope (v1.0)

- Native mobile applications (iOS / Android).
- Integration with external project management tools (Jira, Asana, etc.) — planned for v2.
- AI-generated summaries or smart suggestions — planned for v2.
- Time-sheet export and payroll integration.
- Real-time collaboration / co-editing.
- Advanced analytics and reporting dashboards.

---

## 5. Functional Requirements

> **Notation:** Each user story follows the format:
> *"As a [persona], I want to [action] so that [benefit]."*
> Acceptance criteria are numbered per story and prefixed with **AC**.

---

### 5.1 Task Management

**Overview:** Tasks are the central entity of the application. Every other module (Work Log, Notes, To-Do) can reference a task.

---

#### FR-T-01 — Create a Task

**User Story:**
As an employee, I want to create a new task so that I can capture work I need to track.

**Acceptance Criteria:**
- AC-T-01-1: The task form requires a **Title** (max 200 chars) and optionally accepts: Description, Status, Priority, Due Date, and Tags.
- AC-T-01-2: Status options are: `Backlog`, `In Progress`, `Blocked`, `In Review`, `Done`.
- AC-T-01-3: Priority options are: `Low`, `Medium`, `High`, `Critical`.
- AC-T-01-4: Tags are free-form, comma-separated, stored as an array.
- AC-T-01-5: The task is saved with a `createdAt` timestamp and the creating user as owner.
- AC-T-01-6: The user receives a success confirmation upon saving.

---

#### FR-T-02 — View and Edit a Task

**User Story:**
As an employee, I want to view and edit an existing task so that I can keep it up to date.

**Acceptance Criteria:**
- AC-T-02-1: Clicking a task opens a detail view showing all fields, associated work logs, notes, and linked to-do items.
- AC-T-02-2: All editable fields can be changed inline or via an edit form.
- AC-T-02-3: Changes are saved on explicit action (Save button or keyboard shortcut).
- AC-T-02-4: An `updatedAt` timestamp is recorded on every edit.
- AC-T-02-5: Task history (field change log) is stored but not required to be displayed in v1.

---

#### FR-T-03 — List and Filter Tasks

**User Story:**
As an employee, I want to see a list of my tasks and filter them so that I can focus on relevant work.

**Acceptance Criteria:**
- AC-T-03-1: The default task list shows tasks owned by the authenticated user, sorted by `updatedAt` descending.
- AC-T-03-2: Filters available: Status (multi-select), Priority (multi-select), Tag, Due Date range.
- AC-T-03-3: Active filters are reflected in the URL as query parameters for shareability.
- AC-T-03-4: A Manager or Admin can optionally toggle a view to see tasks for their group members.

---

#### FR-T-04 — Delete / Archive a Task

**User Story:**
As an employee, I want to archive or delete a task so that my task list remains manageable.

**Acceptance Criteria:**
- AC-T-04-1: Archive moves the task to an Archived state; it no longer appears in active lists but remains searchable.
- AC-T-04-2: Delete permanently removes the task and all associated work logs, notes, and to-do links after an explicit confirmation dialog.
- AC-T-04-3: Only the task owner or an Admin can delete a task.

---

### 5.2 Work Log

**Overview:** Work logs record effort and progress associated with a task. They serve as the source of truth for what was done and when.

---

#### FR-WL-01 — Add a Work Log Entry

**User Story:**
As an employee, I want to log work against a task so that I have a detailed record of the effort spent.

**Acceptance Criteria:**
- AC-WL-01-1: A work log entry requires: a linked Task, a Date, and a Description (min 10 chars, max 2000 chars).
- AC-WL-01-2: Optional fields: Time Spent (hours/minutes, numeric), Outcome (short summary, max 500 chars).
- AC-WL-01-3: Multiple work log entries can exist per task.
- AC-WL-01-4: Work logs are displayed chronologically on the task detail page.
- AC-WL-01-5: A standalone "Log Work" entry point exists outside of a task context; the user then selects the associated task.

---

#### FR-WL-02 — Edit and Delete a Work Log

**User Story:**
As an employee, I want to edit or delete a work log entry so that I can correct mistakes.

**Acceptance Criteria:**
- AC-WL-02-1: Only the author of a work log entry can edit or delete it (Admin can override).
- AC-WL-02-2: Deletion requires a confirmation step.
- AC-WL-02-3: Edited entries display an `editedAt` indicator.

---

#### FR-WL-03 — View Work Log History

**User Story:**
As an employee, I want to see all my work log entries in a consolidated view so that I can review effort across all tasks.

**Acceptance Criteria:**
- AC-WL-03-1: A dedicated Work Log page lists all entries by the current user, sorted by date descending.
- AC-WL-03-2: Filters available: Date Range, Associated Task.
- AC-WL-03-3: Total time logged is shown as a summary at the top of the filtered view.

---

### 5.3 Achievements

**Overview:** Achievements capture significant accomplishments that employees want to surface during performance review cycles.

---

#### FR-A-01 — Record an Achievement

**User Story:**
As an employee, I want to record an achievement so that I can refer to it during my yearly performance review.

**Acceptance Criteria:**
- AC-A-01-1: An achievement requires: a Title (max 200 chars) and Description (max 3000 chars).
- AC-A-01-2: Optional fields: Category (e.g., `Leadership`, `Delivery`, `Innovation`, `Collaboration`, `Learning` — admin-configurable), Date Achieved, Related Task (linked reference), Impact Rating (1–5 stars).
- AC-A-01-3: Achievements are private by default (visible only to the owner and their assigned manager).
- AC-A-01-4: The system records `createdAt` and `updatedAt` automatically.

---

#### FR-A-02 — Browse and Filter Achievements

**User Story:**
As an employee, I want to browse my achievements filtered by category or time period so that I can prepare review materials efficiently.

**Acceptance Criteria:**
- AC-A-02-1: Achievements list is sorted by Date Achieved descending by default.
- AC-A-02-2: Filters: Category, Date Range (e.g., current review year), Impact Rating.
- AC-A-02-3: A "Review Year" quick filter uses a configurable fiscal year window.

---

#### FR-A-03 — Export Achievements

**User Story:**
As an employee, I want to export my achievements for a selected period so that I can include them in review documentation.

**Acceptance Criteria:**
- AC-A-03-1: Export formats: PDF and plain-text Markdown.
- AC-A-03-2: The export respects the currently active filters.
- AC-A-03-3: The exported document includes the employee's name, date range, and all achievement fields.

---

### 5.4 Notes

**Overview:** Notes allow employees to capture contextual information — either tied to a specific task or as general free-form entries.

---

#### FR-N-01 — Create a Note

**User Story:**
As an employee, I want to create a note so that I can capture contextual information quickly.

**Acceptance Criteria:**
- AC-N-01-1: Notes require a Body (rich text, min 1 char, max 10,000 chars).
- AC-N-01-2: Optional fields: Title (max 200 chars), Associated Task, Tags.
- AC-N-01-3: Notes without a title default to the first 60 characters of the body as a display label.
- AC-N-01-4: Notes can be created from: the Notes module, or directly from within a Task detail view.
- AC-N-01-5: The editor supports basic rich text: bold, italic, inline code, bullet lists, numbered lists, and hyperlinks.

---

#### FR-N-02 — View and Edit Notes

**User Story:**
As an employee, I want to view and edit my notes so that I can keep them current.

**Acceptance Criteria:**
- AC-N-02-1: Notes are listed with title/preview, associated task (if any), tags, and last modified date.
- AC-N-02-2: Editing opens the full rich-text editor pre-populated with the existing content.
- AC-N-02-3: Auto-save drafts every 30 seconds during editing.

---

#### FR-N-03 — Delete a Note

**User Story:**
As an employee, I want to delete a note I no longer need.

**Acceptance Criteria:**
- AC-N-03-1: Deletion requires a confirmation prompt.
- AC-N-03-2: Only the note owner or an Admin can delete a note.

---

### 5.5 Daily To-Do Items

**Overview:** Daily to-do items help employees plan and execute focused work for the current day. They can optionally be linked to existing tasks.

---

#### FR-TD-01 — Create a To-Do Item

**User Story:**
As an employee, I want to add a to-do item for today so that I can plan my day.

**Acceptance Criteria:**
- AC-TD-01-1: A to-do item requires a Title (max 200 chars).
- AC-TD-01-2: Optional fields: Associated Task, Scheduled Date (defaults to today), Priority, Notes (short text, max 500 chars).
- AC-TD-01-3: Quick-add supports pressing Enter to save and immediately focus a new input for rapid entry.

---

#### FR-TD-02 — Manage To-Do Items

**User Story:**
As an employee, I want to check off, reorder, and edit to-do items so that I can manage my daily plan.

**Acceptance Criteria:**
- AC-TD-02-1: Checking an item marks it as `Complete` with a timestamp.
- AC-TD-02-2: Items can be reordered via drag-and-drop within the same day.
- AC-TD-02-3: Incomplete items from previous days are surfaced with a "carry over" prompt the next time the user opens the app.
- AC-TD-02-4: Carried-over items retain their original creation date.
- AC-TD-02-5: A to-do item can be converted to a full Task with one action.

---

#### FR-TD-03 — Daily To-Do View

**User Story:**
As an employee, I want a dedicated daily view so that I can see today's focus at a glance.

**Acceptance Criteria:**
- AC-TD-03-1: The default view shows all to-do items for today's date.
- AC-TD-03-2: A date picker allows browsing past or future days.
- AC-TD-03-3: Completed items are shown collapsed/dimmed below incomplete items.
- AC-TD-03-4: Progress indicator (e.g., "3 of 7 complete") is displayed.

---

### 5.6 Global Search

**Overview:** Search is a first-class feature enabling employees to find anything across all modules from a single input.

---

#### FR-S-01 — Full-Text Search

**User Story:**
As an employee, I want to search across all my tasks, work logs, achievements, notes, and to-do items from a single search bar so that I can find any information instantly.

**Acceptance Criteria:**
- AC-S-01-1: A persistent search input is accessible from the navigation bar (keyboard shortcut: `Cmd/Ctrl + K`).
- AC-S-01-2: Search indexes: Task title, Task description, Task tags; Work Log description and outcome; Achievement title, description, and category; Note title and body; To-Do item title.
- AC-S-01-3: Results are grouped by module (Tasks, Work Logs, Achievements, Notes, To-Do).
- AC-S-01-4: Each result shows a title, module badge, and a snippet of matching text with the search term highlighted.
- AC-S-01-5: Search results are scoped to the authenticated user's own data by default.
- AC-S-01-6: Results appear within 500ms for datasets up to 10,000 records.

---

#### FR-S-02 — Filtered Search

**User Story:**
As an employee, I want to filter search results by module so that I can narrow down results to the type of content I'm looking for.

**Acceptance Criteria:**
- AC-S-02-1: Module filters are toggleable chips above the results list.
- AC-S-02-2: Selecting one or more module filters restricts results to those module types.
- AC-S-02-3: A date range filter can be applied to all search results.

---

### 5.7 User & Group Management

**Overview:** Admin capabilities to provision users and organise them into groups for visibility and access control.

---

#### FR-UG-01 — User Management (Admin)

**User Story:**
As an Admin, I want to create, edit, and deactivate user accounts so that I can control who has access to the system.

**Acceptance Criteria:**
- AC-UG-01-1: Admin can view all users and their Role and Status (Active / Pending) in the admin panel.
- AC-UG-01-2: Users self-register via the `/register` page; new accounts are created as inactive (`isActive = false`) and require Admin activation before the user can sign in.
- AC-UG-01-3: Admin can change a user's Role (`Admin`, `Manager`, `Member`) from the admin panel.
- AC-UG-01-4: Admin can activate or deactivate any user account except their own; deactivated users cannot log in.
- AC-UG-01-5: Deactivated users' data is retained and remains searchable by Admins.
- AC-UG-01-6: The user list is filterable by Status (All / Pending / Active) in the admin panel.

---

#### FR-UG-02 — Group Management (Admin)

**User Story:**
As an Admin, I want to create groups and assign users to them so that I can organise the team for visibility and reporting.

**Acceptance Criteria:**
- AC-UG-02-1: Admin can create a group with a Name (max 100 chars) and optional Description.
- AC-UG-02-2: Admin can add or remove members from a group at any time.
- AC-UG-02-3: A user can belong to multiple groups.
- AC-UG-02-4: One member of each group must be designated as the Group Manager.
- AC-UG-02-5: The Group Manager role grants visibility into members' tasks and achievements (read-only) within that group.
- AC-UG-02-6: Admin can deactivate or delete a group; deletion requires confirmation and does not delete user accounts.

---

#### FR-UG-03 — Role-Based Access Control

**User Story:**
As a system designer, I want roles to enforce data visibility rules so that employees only see data they are authorised to access.

**Acceptance Criteria:**
- AC-UG-03-1: **Member:** Can only read and write their own data across all modules.
- AC-UG-03-2: **Manager:** Inherits Member permissions; additionally has read-only access to Tasks and Achievements of users in their managed groups.
- AC-UG-03-3: **Admin:** Full read/write access to all data; access to the Admin panel (User and Group management, system configuration).
- AC-UG-03-4: All API endpoints enforce role checks server-side; client-side UI restrictions are supplementary only.

---

#### FR-UG-04 — Authentication

**User Story:**
As a user, I want to sign in securely so that my data is protected.

**Acceptance Criteria:**
- AC-UG-04-1: Authentication via email + password with secure password hashing (bcrypt, min 12 rounds). OAuth sign-in via GitHub, Google, and Facebook is also supported.
- AC-UG-04-2: "Forgot password" flow — planned for a future milestone; not implemented in v1.0.
- AC-UG-04-3: Sessions expire after 8 hours; managed via NextAuth.js JWT strategy.
- AC-UG-04-4: Failed login rate-limiting — planned for a future milestone; not implemented in v1.0.
- AC-UG-04-5: All authentication events are logged with timestamp and IP address — planned for a future milestone.

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID     | Requirement                                                                                    |
|--------|-----------------------------------------------------------------------------------------------|
| NFR-P1 | Page load time (Largest Contentful Paint) < 2.5 seconds on a standard broadband connection.  |
| NFR-P2 | Search results returned within 500ms for up to 10,000 records per user.                       |
| NFR-P3 | API response time < 300ms for 95th percentile under normal load.                              |
| NFR-P4 | Application supports up to 500 concurrent users without degradation.                          |

### 6.2 Reliability & Availability

| ID     | Requirement                                                           |
|--------|-----------------------------------------------------------------------|
| NFR-R1 | System uptime of 99.5% excluding planned maintenance windows.         |
| NFR-R2 | Automated daily database backups retained for 30 days.                |
| NFR-R3 | Recovery Time Objective (RTO): 4 hours. Recovery Point Objective (RPO): 24 hours. |

### 6.3 Security

| ID     | Requirement                                                                                   |
|--------|-----------------------------------------------------------------------------------------------|
| NFR-S1 | All data in transit encrypted via TLS 1.3+.                                                   |
| NFR-S2 | All data at rest encrypted using AES-256.                                                     |
| NFR-S3 | Input validation and sanitisation on all user-supplied fields to prevent XSS and SQL injection. |
| NFR-S4 | OWASP Top 10 mitigations applied at both API and UI layers.                                   |
| NFR-S5 | CSRF protection on all state-changing operations.                                             |
| NFR-S6 | Security headers (CSP, HSTS, X-Frame-Options) configured on all responses.                   |
| NFR-S7 | Dependency vulnerability scanning in CI pipeline (e.g., npm audit, Snyk).                    |

### 6.4 Usability

| ID     | Requirement                                                                                   |
|--------|-----------------------------------------------------------------------------------------------|
| NFR-U1 | Application is fully responsive across desktop (≥1024px), tablet (768–1023px), and mobile (≤767px). |
| NFR-U2 | Core workflows completable in ≤ 3 clicks from any module's landing page.                      |
| NFR-U3 | WCAG 2.1 AA accessibility compliance.                                                         |
| NFR-U4 | Support for latest 2 versions of Chrome, Firefox, Safari, and Edge.                           |

### 6.5 Maintainability & Scalability

| ID     | Requirement                                                                            |
|--------|----------------------------------------------------------------------------------------|
| NFR-M1 | Test coverage ≥ 80% on all business-logic modules.                                     |
| NFR-M2 | Codebase follows SOLID principles and defined coding standards.                         |
| NFR-M3 | Database schema managed via versioned migrations (Prisma).                              |
| NFR-M4 | Application deployed on Vercel with auto-scaling; database on managed PostgreSQL.       |
| NFR-M5 | All infrastructure configuration stored as code (IaC).                                 |

### 6.6 Data Integrity

| ID     | Requirement                                                                                    |
|--------|-----------------------------------------------------------------------------------------------|
| NFR-D1 | Referential integrity enforced at the database level (foreign key constraints).               |
| NFR-D2 | Soft-delete pattern used for Tasks, Notes, and Achievements to prevent accidental data loss.  |
| NFR-D3 | Auto-save for Notes drafts every 30 seconds to prevent data loss during editing.              |

---

## 7. Assumptions

| ID   | Assumption                                                                                             |
|------|--------------------------------------------------------------------------------------------------------|
| A-1  | The application serves a single organisation (single-tenant) in v1.0.                                 |
| A-2  | All users have access to a modern browser and a stable internet connection.                            |
| A-3  | Authentication in v1.0 supports email + password and OAuth providers (GitHub, Google, Facebook); all new accounts (credentials or OAuth) are inactive until an Admin activates them. |
| A-4  | Users self-register via the registration form; self-registered accounts require Admin approval before first login.                                                                  |
| A-5  | The application is English-only in v1.0; internationalisation is deferred.                            |
| A-6  | Each user's data is private by default; sharing outside group visibility rules is not required in v1.0. |
| A-7  | Achievement categories are configurable by an Admin via the admin panel.                               |
| A-8  | Fiscal / review year windows are configurable by an Admin.                                             |
| A-9  | Email delivery for future features (password reset, notifications) will use a third-party transactional email service (e.g., Resend); not required for v1.0 auth flow. |

---

## 8. Constraints

| ID   | Constraint                                                                                             |
|------|--------------------------------------------------------------------------------------------------------|
| C-1  | Technology stack is fixed: Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, Prisma + PostgreSQL, NextAuth.js v5. |
| C-2  | Deployment platform is Vercel; database must be compatible with Vercel's hosting environment.          |
| C-3  | No native mobile app in v1.0; the web app must be fully responsive.                                   |
| C-4  | No external project management integrations in v1.0.                                                  |
| C-5  | The application must comply with GDPR data handling requirements for EU users.                        |
| C-6  | Total cost of infrastructure must remain within the organisation's approved budget for SaaS tooling.   |

---

## 9. Dependencies

| ID   | Dependency                          | Type     | Notes                                                                 |
|------|-------------------------------------|----------|-----------------------------------------------------------------------|
| D-1  | Managed PostgreSQL instance          | External | Must be provisioned before development of data-layer begins.          |
| D-2  | Transactional email service (Resend) | External | Planned for password reset and future notification flows; not active in v1.0. |
| D-3  | Vercel account and project setup     | Platform | CI/CD pipeline and preview deployments depend on this.                |
| D-4  | Design system / component library    | Internal | UI component decisions must be finalised before front-end development. |

---

## 10. Success Metrics

### 10.1 Adoption Metrics

| Metric                             | Target                                  |
|------------------------------------|-----------------------------------------|
| User activation rate               | ≥ 80% of provisioned users log in within 7 days of invitation |
| Daily Active Users (DAU)           | ≥ 60% of provisioned users active per working day after 60 days |
| Module engagement                  | ≥ 70% of active users interact with ≥ 3 modules per week |

### 10.2 Productivity Metrics

| Metric                                        | Target                                       |
|-----------------------------------------------|----------------------------------------------|
| Tasks created per user per week                | Baseline established in month 1              |
| Work log entries per user per week             | ≥ 3 entries per active user                  |
| To-do completion rate                          | ≥ 65% of daily to-do items marked complete   |

### 10.3 Review Cycle Metrics

| Metric                                        | Target                                       |
|-----------------------------------------------|----------------------------------------------|
| Time to compile review materials               | Reduced by ≥ 50% compared to pre-adoption baseline |
| Achievements logged per user per quarter       | ≥ 2 achievements                             |

### 10.4 Quality Metrics

| Metric                                   | Target                     |
|------------------------------------------|----------------------------|
| System uptime                            | ≥ 99.5%                    |
| Critical bug rate post-launch            | 0 P1 bugs in first 30 days |
| User-reported satisfaction score (CSAT)  | ≥ 4.0 / 5.0 at 90-day mark |
| Search result accuracy                   | ≥ 95% relevant results for top 20 common queries |

---

## 11. Glossary

| Term             | Definition                                                                                       |
|------------------|--------------------------------------------------------------------------------------------------|
| Task             | A discrete unit of work an employee is tracking, with a status lifecycle.                        |
| Work Log         | A time-stamped record of effort or activity associated with a Task.                              |
| Achievement      | A significant accomplishment recorded by an employee for performance review purposes.            |
| Note             | A free-form text entry, optionally linked to a Task, for capturing context or information.       |
| To-Do Item       | A short-form action item planned for a specific day, optionally linked to a Task.                |
| Group            | An organisational unit containing one or more users with a designated Group Manager.             |
| Group Manager    | A user with read-only visibility into the Tasks and Achievements of their group members.         |
| Admin            | A user with full system access including the Admin panel for user and group management.          |
| Soft Delete      | A deletion pattern where records are marked as deleted but not physically removed from the database. |
| RBAC             | Role-Based Access Control — a method of restricting data access based on assigned roles.         |
| RTO              | Recovery Time Objective — the maximum acceptable downtime following a system failure.            |
| RPO              | Recovery Point Objective — the maximum acceptable data loss measured in time.                    |

---

*End of Document — BRD-001 v1.0*