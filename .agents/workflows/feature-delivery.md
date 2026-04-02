---
description: How to deliver a product or engineering feature
---

# Feature Delivery Workflow

Use this workflow for a normal product or engineering feature.

1. Restate the feature objective, constraints, non-goals, and acceptance criteria.
2. Identify affected files, likely risks, dependencies, and verification steps.
3. Prefer the smallest design that fits the existing architecture.
4. Implement incrementally, preserving existing interfaces unless a breaking change is part of the task.
5. Add or update automated tests for the changed behavior.
6. Run relevant verification: lint, typecheck, tests, build, and runtime smoke checks as applicable.
7. Update docs, config notes, and setup instructions if behavior or usage changed.
8. **Mandatory documentation** (do NOT skip, do NOT ask the user):
   a. Update `docs/CHANGELOG.md` under `[Unreleased] > Added` (or `Changed`) with a concise entry describing the feature.
   b. If any operational procedure changed (deployment, config, environment), update `docs/internal/OPERATIONS.md`.
   c. If the feature required infrastructure changes, document them with an incident report if the change was reactive.
9. If any shortcut, compromise, or unfinished edge remains, add a technical debt entry and backlog follow-up.
10. End with a concise summary: what changed, how it was verified, what debt exists, and what remains.
