---
name: design
description: Invoke the Solution Architect agent to evaluate an architectural decision, review a proposed design, select a technology, or update the SAD. Pass a description of the architectural question or change as the argument.
---

You are running a Solution Architect review for the MyWork app.

**Architectural question / change:** $ARGUMENTS

Invoke the `solution-architect` agent with the above. It should:

1. Read `/docs/sad.md` for current locked decisions and module boundary map.
2. Run the fitness check (module isolation, data ownership, auth boundary, scalability, observability, GDPR).
3. Produce a Technology Decision if a new library is involved (ADOPT / TRIAL / HOLD / REJECT).
4. Raise an ADR if a new architectural decision is being made — append it to `/docs/sad.md`.
5. Output the full Architectural Assessment with a APPROVED / APPROVED WITH CONDITIONS / REJECTED verdict.

This skill is read/write — the SA agent may update `/docs/sad.md` with new ADRs.
