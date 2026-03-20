# Contributing Guide

> How to contribute to the AI Monitor SDK â€” development setup, project structure, coding standards, testing, and release process.

---

## Development Setup

### Prerequisites

- **Node.js** â‰¥ 18
- **pnpm** â‰¥ 9

### Getting Started

```bash
git clone https://github.com/AKER-LINK/ai-monitor-sdk.git
cd ai-monitor-sdk

# Install all dependencies (root + all packages)
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Format code
pnpm run format
```

---

## Project Structure

```
ai-monitor-sdk/
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ ai-monitor-core/           # Core monitoring engine
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ monitor.ts         # AIMonitor class
â”‚   â”‚   â”‚   â”œâ”€â”€ ai-service.ts      # AIService (LLM integration)
â”‚   â”‚   â”‚   â”œâ”€â”€ config-builder.ts  # Fluent ConfigBuilder
â”‚   â”‚   â”‚   â”œâ”€â”€ logger-adapter.ts  # Console + Winston adapters
â”‚   â”‚   â”‚   â”œâ”€â”€ types.ts           # Core interfaces (INotifier, IAlert, etc.)
â”‚   â”‚   â”‚   â”œâ”€â”€ ai-types.ts        # AI-specific types (IAIAnalysis, etc.)
â”‚   â”‚   â”‚   â”œâ”€â”€ index.ts           # Public API barrel
â”‚   â”‚   â”‚   â””â”€â”€ __tests__/         # Unit tests
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â””â”€â”€ tsconfig.json
â”‚   â”‚
â”‚   â”œâ”€â”€ ai-monitor-notifiers/      # Notification channels
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ telegram-notifier.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ slack-notifier.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ email-notifier.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ multi-notifier.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ index.ts
â”‚   â”‚   â”‚   â””â”€â”€ __tests__/
â”‚   â”‚   â””â”€â”€ package.json
â”‚   â”‚
â”‚   â””â”€â”€ ai-monitor-instrumentation/  # Auto-instrumentation
â”‚       â”œâ”€â”€ src/
â”‚       â”‚   â”œâ”€â”€ instrumentation.ts    # Main orchestrator
â”‚       â”‚   â”œâ”€â”€ system-metrics.ts     # CPU/memory collector
â”‚       â”‚   â”œâ”€â”€ http-interceptor.ts   # HTTP middleware
â”‚       â”‚   â”œâ”€â”€ error-interceptor.ts  # Uncaught error handler
â”‚       â”‚   â”œâ”€â”€ performance-monitor.ts# Operation timing
â”‚       â”‚   â”œâ”€â”€ metric-aggregator.ts  # P95 + error rate windows
â”‚       â”‚   â”œâ”€â”€ prometheus-exporter.ts# /metrics endpoint
â”‚       â”‚   â”œâ”€â”€ resource-monitor.ts   # DB + queue monitoring
â”‚       â”‚   â”œâ”€â”€ types.ts
â”‚       â”‚   â”œâ”€â”€ index.ts
â”‚       â”‚   â””â”€â”€ __tests__/
â”‚       â””â”€â”€ package.json
â”‚
â”œâ”€â”€ examples/
â”‚   â””â”€â”€ standalone-service/        # Production-ready example
â”‚
â”œâ”€â”€ .github/workflows/
â”‚   â”œâ”€â”€ ci.yml                     # Lint â†’ Build â†’ Test
â”‚   â””â”€â”€ publish.yml                # Tag-triggered npm publish
â”‚
â”œâ”€â”€ docker-compose.yml             # Monitor + Prometheus + Grafana
â”œâ”€â”€ Dockerfile                     # Multi-stage production build
â”œâ”€â”€ prometheus/prometheus.yml      # Scrape config
â”œâ”€â”€ grafana/provisioning/          # Auto-provisioned datasources
â”œâ”€â”€ jest.config.js                 # Root test config
â”œâ”€â”€ pnpm-workspace.yaml            # Monorepo workspace
â””â”€â”€ package.json                   # Root scripts
```

---

## Workspace Architecture

This is a **pnpm workspace monorepo**. The workspace is defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

### Package Dependencies

- `ai-monitor-core` â€” **zero runtime deps**, self-contained
- `ai-monitor-notifiers` â€” depends on `core` (dev), optional peers: `telegram`, `axios`, `nodemailer`
- `ai-monitor-instrumentation` â€” depends on `core` (peer + dev)
- `examples/standalone-service` â€” depends on `core` + `notifiers`

---

## Coding Standards

### TypeScript

- Target: **ES2020** with **Node16** module resolution
- Strict mode enabled
- All public APIs must have JSDoc comments
- Use `interface` over `type` for object shapes
- Prefix interfaces with `I` (e.g., `INotifier`, `IAlert`)

### Build Tool

All packages use **tsup** for building:

```bash
tsup src/index.ts --format cjs,esm --dts --clean
```

This produces:

- `dist/index.js` â€” CommonJS
- `dist/index.mjs` â€” ESM
- `dist/index.d.ts` â€” TypeScript declarations

### Code Style

- **Prettier** for formatting (`pnpm run format`)
- **ESLint** with `@typescript-eslint` for linting (`pnpm run lint`)
- Single quotes, trailing commas, 2-space indent

---

## Testing

### Framework

- **Jest** with **ts-jest** preset
- Tests live in `src/__tests__/*.spec.ts` within each package
- Root config (`jest.config.js`) runs all package tests from the workspace root

### Current Test Suite

| Package           | Test Files                                                                                  | Description       |
| ----------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| `core`            | `monitor.spec.ts`, `ai-service.spec.ts`, `config-builder.spec.ts`, `logger-adapter.spec.ts` | Core engine tests |
| `notifiers`       | `slack-notifier.spec.ts`, `multi-notifier.spec.ts`                                          | Channel tests     |
| `instrumentation` | `metric-aggregator.spec.ts`, `prometheus-exporter.spec.ts`                                  | Metrics tests     |

### Running Tests

```bash
# All tests
pnpm run test

# With coverage
pnpm run test:coverage

# Specific package
cd packages/ai-monitor-core && pnpm test
```

### Module Mapping

The root `jest.config.js` maps package imports to source directories for seamless cross-package testing:

```javascript
moduleNameMapper: {
  '^@momen124/ai-monitor-core$': '<rootDir>/packages/ai-monitor-core/src',
  '^@momen124/ai-monitor-notifiers$': '<rootDir>/packages/ai-monitor-notifiers/src',
  '^@momen124/ai-monitor-instrumentation$': '<rootDir>/packages/ai-monitor-instrumentation/src',
}
```

---

## Creating a New Notifier

1. Create `packages/ai-monitor-notifiers/src/my-notifier.ts`
2. Implement `INotifier` from `@momen124/ai-monitor-core`
3. Export from `packages/ai-monitor-notifiers/src/index.ts`
4. Add peer dependency to `package.json` (if needed) with `optional: true`
5. Write tests in `src/__tests__/my-notifier.spec.ts`
6. Document in `docs/04-api-notifiers.md`

---

## Release Process

1. Update version in relevant `package.json` files
2. Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/)
3. Commit: `git commit -m "chore: release v1.x.x"`
4. Tag: `git tag v1.x.x`
5. Push: `git push origin main --tags`
6. The `publish.yml` workflow automatically publishes all packages to npm

---

## License

MIT Â© AKER Team
