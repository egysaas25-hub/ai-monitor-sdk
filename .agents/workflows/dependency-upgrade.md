---
description: How to upgrade libraries, frameworks, runtimes, or tooling
---

# Dependency Upgrade Workflow

Use this workflow when upgrading libraries, frameworks, runtimes, SDKs, or tooling.

1. Record the current version, target version, motivation, and expected impact.
2. Read release notes, deprecations, breaking changes, migration guides, and security notes.
3. Prefer the smallest upgrade set required for the task.
4. Pin versions where appropriate and avoid unrelated package churn.
5. Update affected code, configs, generated artifacts, and docs.
6. Regenerate client types, stubs, or lockfiles when the stack requires it.
7. Run the full relevant verification stack, including build and tests.
8. Update the changelog with upgrade notes and any migration instructions.
9. If partial compatibility shims or temporary workarounds were added, record them in technical debt.
10. End with the upgraded versions, breaking changes handled, verification, and rollback notes.
