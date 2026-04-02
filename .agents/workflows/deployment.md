---
description: How to deploy to staging or production environments
---

# Deployment Workflow

Use this workflow for deploying to staging or production environments (generic, not TMA-specific).

1. Confirm what is being deployed: version, branch, commit SHA, and included changes.
2. Pre-deployment checks:
   - CI pipeline is green (build, lint, typecheck, tests)
   - security scans passed
   - no placeholder secrets or debug code
   - changelog and release notes are current
3. Verify environment readiness:
   - target environment is accessible
   - required environment variables are configured
   - database migrations are ready (forward and rollback)
   - feature flags are set correctly
4. Deploy to staging first:
   - run the deployment script or CI/CD pipeline
   - verify the deployment completed without errors
   - run smoke tests against staging
   - verify critical user paths manually if applicable
5. Staging validation:
   - functional verification of changed features
   - regression check on core workflows
   - performance sanity check
   - confirm monitoring and alerting are active
6. Production deployment (after staging approval):
   - confirm rollback plan is documented and tested
   - deploy using the same mechanism as staging
   - monitor deployment progress
7. Post-deployment verification:
   - health check endpoints respond correctly
   - smoke tests pass in production
   - error rates are within normal range
   - no new alerts triggered
8. If issues are detected:
   - assess severity and blast radius
   - rollback if user impact is significant
   - route to hotfix workflow if rollback is not sufficient
   - **create an incident report** at `docs/private/history/YYYY-MM-DD-<slug>.md` documenting the failed deployment
9. **Mandatory documentation** (do NOT skip, do NOT ask the user):
   a. Update `docs/CHANGELOG.md` under `[Unreleased]` to finalize entries for this deployment.
   b. If any deployment or operational procedures changed, update `docs/internal/OPERATIONS.md`.
   c. If any infrastructure changes were made (server config, cron jobs, resource tuning), add an entry to `docs/internal/OPERATIONS.md` and create an incident report if the change was reactive.
10. Notify team of successful deployment with version and key changes.
