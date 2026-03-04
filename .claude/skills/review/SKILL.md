---
name: review
description: Run a Tech Lead architecture and SOLID review on the current git diff. Optionally pass a file path or PR branch to scope the review.
---

You are running a Tech Lead code review for the MyWork app.

**Scope:** $ARGUMENTS (if empty, review all changes in `git diff main..HEAD`)

## Steps

1. Run `git diff main..HEAD` (or the scoped path/branch if provided) to get the full set of changes.
2. Invoke the `tech-lead` agent with that diff as context.
3. The tech-lead agent must produce a structured review covering:
   - Architecture alignment (SAD-001 layering, RSC vs client boundaries)
   - SOLID principles
   - Security checks (RBAC, Zod validation, no PII logged)
   - New dependencies (if any) with justification
   - Performance concerns
4. Output the review with a clear **APPROVE** or **NEEDS CHANGES** verdict.
5. If NEEDS CHANGES: list each issue with file:line reference and a suggested fix.

Do not modify any files — this is a read-only review pass.
