---
description: How to perform database, schema, data, or config migrations
---

# Migration Workflow

Use this workflow for database migrations, schema evolution, data moves, auth migrations, and config migrations.

1. Define forward plan, rollback or restore plan, impact radius, and downtime expectations.
2. Confirm backup or restore awareness before destructive or structural steps.
3. Prefer reversible and incremental migrations where practical.
4. Separate schema change, data backfill, and application switch-over when possible.
5. Make write paths safe for mixed-version or transitional states if zero-downtime matters.
6. Update code, schemas, fixtures, seeds, and generated types together.
7. Run migration validation plus application compile, tests, and smoke checks.
8. Update runbooks, operational docs, and changelog with migration notes.
9. If any temporary compatibility layer remains, add a technical debt entry and cleanup follow-up.
10. End with execution steps, rollback steps, verification, and residual risk.
