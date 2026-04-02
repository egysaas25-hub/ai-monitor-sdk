---
trigger: always_on
glob:
description: Mandatory changelog and incident report generation rules
---

# Auto-Documentation Rules

These rules apply to EVERY task that modifies code, fixes bugs, changes infrastructure, or resolves incidents. They are NOT optional. Do NOT ask the user for permission — generate the documentation automatically as part of task completion.

## Changelog (`docs/CHANGELOG.md`)

**When:** After EVERY task that changes code, config, infrastructure, or operational behavior.

- Add an entry under `[Unreleased]` in the appropriate section (`Added`, `Fixed`, `Changed`, `Removed`).
- Prefix each entry with the component in bold: `**Backend:**`, `**Frontend:**`, `**TMA:**`, `**DevOps:**`, `**Docs:**`.
- Include severity if it was a production issue: `**(SEV-1)**, **(SEV-2)**, **(SEV-3)**, **(SEV-4)**`.
- Be concise but specific: state what was wrong and what was done (not just "fixed bug").

## Incident Reports (`docs/private/history/`)

**When:** After ANY of these:
- A production issue was discovered and fixed
- A server or service was degraded, unavailable, or at risk
- An emergency or hotfix was applied
- A security issue was found and remediated
- A deployment failed and required rollback or manual intervention
- An infrastructure issue was identified and resolved (disk, memory, network, etc.)

**Format:** Create `docs/private/history/YYYY-MM-DD-<slug>.md` with:
1. **Summary** — 1-2 sentences describing what happened
2. **Severity** — SEV-1 through SEV-4
3. **Root Cause** — Why it happened
4. **Impact** — What was affected, for how long
5. **Resolution** — What was done to fix it
6. **Lessons Learned** — How to prevent it in the future
7. **Action Items** — Table with status (✅ Done / 📋 Future)

## Operations Runbook (`docs/internal/OPERATIONS.md`)

**When:** After any change to:
- Server cron jobs, system config, or provisioning
- Docker Compose, resource limits, or container config
- Deployment scripts or CI/CD pipeline behavior
- Backup/restore procedures
- Monitoring, alerting, or health check setup

## Technical Debt

- If a fix introduces, preserves, or knowingly increases technical debt, record it in `docs/BACKLOG.md` with context, impact, cleanup plan, and priority.
- Any TODO/FIXME comments must include a tracking reference to the backlog entry.
