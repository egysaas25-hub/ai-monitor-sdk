# Pull Request Template

Use this template for all pull requests.

## What this PR does

[Brief description of the change]

## Why

[Business context or link to issue]

Closes #XXX

## Type of change

- [ ] New feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Refactoring
- [ ] Documentation
- [ ] Dependencies update
- [ ] Infrastructure / DevOps
- [ ] Database migration

## Checklist

### Code Quality
- [ ] Code follows project conventions and existing patterns
- [ ] Self-reviewed the diff before requesting review
- [ ] No console.log, print statements, or debug code
- [ ] No hardcoded secrets, credentials, or API keys
- [ ] No commented-out code without explanation

### Testing
- [ ] Tests added or updated for changed behavior
- [ ] Edge cases and error paths covered
- [ ] All existing tests still pass
- [ ] Build succeeds without warnings

### Security
- [ ] Authentication required on new endpoints
- [ ] Authorization checks enforced (ownership validation)
- [ ] Input validated and sanitized
- [ ] PII masked in logs
- [ ] Request size limits on new endpoints

### Documentation
- [ ] README updated if setup or usage changed
- [ ] API docs updated if endpoints changed
- [ ] Changelog entry added
- [ ] Migration notes if schema or config changed

### Accessibility (if UI change)
- [ ] Interactive elements have accessible labels
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient
- [ ] Reduced motion respected

## Screenshots (if UI change)

| Before | After |
|--------|-------|
|        |       |

## Migration / Deployment Notes

[Any special steps needed for deployment]

## Rollback Plan

[How to revert if something goes wrong]
