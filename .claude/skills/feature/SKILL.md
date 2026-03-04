---
name: feature
description: Full feature pipeline — BA → (SA if needed) → Developer → Tester → Tech Lead review. Pass the feature name or description as the argument.
---

You are orchestrating the full feature delivery pipeline for the MyWork app. The argument provided is:

**Feature request:** $ARGUMENTS

Work through each stage in order. After each stage completes, write a handoff entry to `.claude/handoffs/<kebab-case-feature-name>.md` (create it from `.claude/handoffs/TEMPLATE.md` if it doesn't exist yet) before moving to the next stage. Use git state as shared context between stages.

---

## Stage 1 — Business Analyst

Invoke the `business-analyst` agent with the feature request above.

It must produce:
- BRD alignment check (which FR-X-XX covers this, or confirm it is out of scope)
- Clarifying questions answered (if any are unresolved, STOP and ask the user before continuing)
- Acceptance criteria in Given/When/Then format
- `SA_REVIEW_REQUIRED: true/false` — set true if the feature involves any of:
  - A new Prisma top-level model
  - A new external service or infrastructure component
  - A new client-side library > 20kB gzipped
  - Cross-module data sharing between services
  - Any change to auth, RBAC, or middleware rules
- A handoff entry written to `.claude/handoffs/<feature>.md` under "Stage Completed: business-analyst"

**Do not proceed until all clarifying questions are resolved.**

---

## Stage 1b — Solution Architect _(conditional)_

**Only invoke if** the BA set `SA_REVIEW_REQUIRED: true`.

Invoke the `solution-architect` agent with:
- The BA handoff entry (acceptance criteria + scope)
- The specific architectural trigger(s) flagged by BA

It must produce:
- Fitness check against the 6 architectural concerns
- Technology decision for any new library (ADOPT / TRIAL / HOLD / REJECT)
- Any new ADRs appended to `/docs/sad.md`
- Binding constraints for the developer (patterns to use, modules to avoid, etc.)
- A APPROVED / APPROVED WITH CONDITIONS / REJECTED verdict

**If REJECTED: stop and return to BA to revise scope. Do not proceed to development.**

---

## Stage 2 — Developer

Invoke the `developer` agent with:
- The acceptance criteria from Stage 1
- The architectural constraints from Stage 1b (if SA was invoked)
- The handoff file path so it can read prior context

It must produce:
- All code changes following the schema → service → action → page layering
- Co-located `.test.ts` stubs (at minimum) for every new service or schema file
- A handoff entry appended under "Stage Completed: developer" listing every file created or modified

---

## Stage 3 — Tester

Invoke the `tester` agent with:
- The list of changed files from the developer handoff
- The acceptance criteria from Stage 1 (to derive test cases)

It must:
- Complete or expand test stubs to full coverage
- Run `npx jest` and confirm all tests pass
- Run `npm run type-check` and confirm 0 errors
- Report coverage for changed service/schema files vs the required gates
- Append a handoff entry under "Stage Completed: tester" with pass/fail summary

**If tests fail or coverage gates are not met, return to Stage 2 with specific fix instructions.**

---

## Stage 4 — Tech Lead

Invoke the `tech-lead` agent with:
- Output of `git diff main` (all changes in this feature branch)
- The handoff file for context

It must produce:
- Architecture alignment verdict (if SA was involved, verify implementation matches the SA constraints)
- SOLID issues (if any)
- Security checks
- A final **APPROVE** or **NEEDS CHANGES** verdict

**If an architectural concern is outside the Tech Lead's authority to decide, escalate to the `solution-architect` agent before giving a verdict.**

**If NEEDS CHANGES: list the issues, return to Stage 2, do not proceed to merge.**

---

## Completion

When all stages return green:
1. Summarise what was built in one paragraph
2. List any ADRs raised during the pipeline
3. Show the final handoff file path
4. Remind the user to run `/ship` before merging to main
