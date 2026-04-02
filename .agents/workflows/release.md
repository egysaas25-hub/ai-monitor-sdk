---
description: How to cut a release, tag, or deployable version
---

# Release Workflow

Use this workflow for a planned release, tag, or deployable version cut.

1. Review unreleased changes and group them by Added, Changed, Fixed, Security, Docs, Internal, and Removed.
2. Confirm semantic version bump level and rationale.
3. Ensure build, tests, typecheck, lint, and release-specific validations are green.
4. Confirm migrations, feature flags, environment requirements, and rollback path.
5. Update changelog, release notes, and operational notes.
6. Confirm no debug code, placeholder secrets, or temporary bypasses remain.
7. Tag the release consistently.
8. If release risk remains, document it explicitly with mitigation.
9. Record any deferred post-release cleanup in technical debt or backlog.
10. End with version, changes included, verification, deploy notes, and rollback summary.
