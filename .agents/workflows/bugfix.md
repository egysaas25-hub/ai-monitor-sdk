---
description: How to fix a bug, regression, or production issue
---

# Bugfix Workflow

Use this workflow for defects, regressions, flaky behavior, and production issues.

1. Define the bug in concrete terms: expected behavior, actual behavior, scope, and impact.
2. Reproduce the issue or gather the strongest available evidence if direct reproduction is not feasible.
3. Identify root cause. Do not stop at symptom suppression unless emergency containment is explicitly required.
4. Add or update a failing regression test when feasible.
5. Implement the minimal safe fix with the lowest blast radius.
6. Verify against the original failure mode and nearby regression risks.
7. Run relevant lint, typecheck, tests, build, and runtime checks.
8. **Mandatory documentation** (do NOT skip, do NOT ask the user):
   a. Update `docs/CHANGELOG.md` under `[Unreleased] > Fixed` with a concise entry describing the bug and fix.
   b. If the bug affected production or a deployed environment, create an incident report at `docs/private/history/YYYY-MM-DD-<slug>.md` containing: summary, root cause, impact, resolution, and lessons learned.
   c. If any operational procedure changed or was added, update `docs/internal/OPERATIONS.md`.
9. If any workaround or known limitation remains, record it in technical debt and backlog.
10. Summarize root cause, fix, verification, and remaining risk.
