---
description: How to initialize a new project or repository from scratch
---

# Project Setup Workflow

Use this workflow when creating a new project, repository, or application from scratch.

1. Define project purpose, tech stack, and constraints before writing code.
2. Initialize the repository:
   - `git init` with a meaningful `.gitignore` for the chosen stack
   - choose branching strategy (trunk-based, GitHub Flow, or GitFlow)
   - set up branch protection on main/develop
3. Create foundational files:
   - `README.md` with purpose, setup instructions, architecture overview
   - `.env.example` with all required variables (no real values)
   - `CHANGELOG.md` using the changelog template
   - `TECH_DEBT.md` using the tech debt template
   - `LICENSE` file appropriate for the project
4. Set up code quality tooling:
   - linter and formatter (Biome, ESLint + Prettier, or equivalent)
   - type checker in strict mode (TypeScript, mypy, etc.)
   - pre-commit hooks (Husky, lefthook) for lint + typecheck + secrets scan
   - `.editorconfig` for consistent editor behavior
5. Set up CI pipeline:
   - lint, typecheck, build, and test on every PR
   - dependency and secrets scanning
   - block merge on failure
6. Set up containerization if applicable:
   - `Dockerfile` with multi-stage builds
   - `docker-compose.yml` for local development
   - document port mappings and service dependencies
7. Create initial project structure following the chosen architecture patterns.
8. Add PR template and issue templates to the repository.
9. Write initial seed data or fixtures if the project has a database.
10. Verify the complete setup: clone → install → configure → run → test passes end to end.
