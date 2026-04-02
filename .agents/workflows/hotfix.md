---
description: How to handle emergency production fixes
---

# Hotfix Workflow

Use this workflow for emergency production fixes that cannot wait for normal release cycles.

1. Confirm the severity: is this a true emergency requiring immediate production intervention?
2. Document the incident: symptoms, user impact, affected services, and blast radius.
3. Create a hotfix branch from the production tag or main branch.
4. Implement the minimal fix. Do not bundle unrelated changes.
5. Verify the fix resolves the specific issue without side effects.
6. Run the fastest meaningful verification: build, critical tests, and smoke checks.
7. Deploy to production using the standard deployment path with expedited approval.
8. Verify the fix in production: confirm symptoms are resolved, monitor for new errors.
9. Backport the fix to the develop branch within 24 hours.
10. **Mandatory documentation** (do NOT skip, do NOT ask the user — generate all of this automatically):
    a. Create an incident report at `docs/private/history/YYYY-MM-DD-<slug>.md` containing:
       - Summary of the incident
       - Root cause analysis
       - Impact (duration, affected users/services, severity level)
       - Timeline of events (detection → containment → fix → verification)
       - Resolution details and what was deployed
       - Lessons learned and prevention measures
       - Action items (with status: ✅ Done / 📋 Future)
    b. Update `docs/CHANGELOG.md` under `[Unreleased] > Fixed` with the hotfix version and description.
    c. If any operational procedure changed, update `docs/internal/OPERATIONS.md`.
11. Schedule a post-hoc review within 48 hours:
    - full PR review of the hotfix code
    - add regression test if not done during the fix
    - record any remaining cleanup in technical debt
