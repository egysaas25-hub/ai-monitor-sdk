---
description: How to investigate unknown issues, flaky tests, or unclear behavior
---

# Investigation Workflow

Use this workflow for unknown issues, flaky tests, unclear behavior, or codebase research.

1. Define the question to answer and what evidence would settle it.
2. Gather evidence from code, tests, logs, docs, configs, and reproducible behavior.
3. Separate facts, hypotheses, and unknowns.
4. Narrow the likely cause with targeted experiments instead of broad guessing.
5. Preserve an evidence trail in notes or artifacts.
6. If a fix is made, route into Bugfix Workflow or Feature Delivery Workflow.
7. If no fix is made, still document findings, risk, and recommended next step.
8. Add backlog or technical debt items for unresolved but important findings.
9. **Mandatory documentation** (do NOT skip, do NOT ask the user):
   a. If code or operational behavior changed, update `docs/CHANGELOG.md` under the appropriate section.
   b. If the investigation revealed an issue that affected production, create an incident report at `docs/private/history/YYYY-MM-DD-<slug>.md`.
   c. If operational procedures were added or modified, update `docs/internal/OPERATIONS.md`.
10. End with findings, confidence level, remaining uncertainty, and next action.
