---
description: How to perform a security audit or review
---

# Security Audit Workflow

Use this workflow for periodic security reviews, pre-release security checks, or investigating security concerns.

1. Define the audit scope: full application, specific module, dependencies only, or incident-driven.
2. Run dependency scans:
   - `npm audit` / `pnpm audit` / equivalent for the package manager
   - check for known CVEs in all transitive dependencies
   - review dependency age and maintenance status
3. Run secrets scanning:
   - scan the entire repository for hardcoded secrets, API keys, tokens, and credentials
   - verify `.env.example` contains no real values
   - verify `.gitignore` excludes all secret files
   - check git history for accidentally committed secrets
4. Review authentication:
   - token expiration and rotation
   - password hashing algorithm (bcrypt/scrypt/argon2, not MD5/SHA-1)
   - session management and invalidation
   - rate limiting on auth endpoints
5. Review authorization:
   - ownership validation on every mutating operation
   - RBAC/ABAC enforcement at service level, not just UI
   - no check-then-update race windows (TOCTOU)
   - row-level security where applicable
6. Review input handling:
   - all endpoints validate input (type, length, format, range)
   - request body size limits enforced
   - output properly escaped per context
   - file uploads validated and sandboxed
7. Review infrastructure:
   - TLS enforced everywhere
   - security headers configured (CSP, HSTS, X-Frame-Options)
   - CORS policy is restrictive, not `*`
   - cookie flags set (Secure, HttpOnly, SameSite)
   - error responses don't leak internal details
8. Review logging:
   - sensitive data masked in all logs
   - authentication events logged
   - authorization failures logged
   - no PII in plain text logs
9. Document all findings with severity (Critical, High, Medium, Low, Info).
10. Create remediation tickets for all findings above Info, prioritized by severity and exploitability.
