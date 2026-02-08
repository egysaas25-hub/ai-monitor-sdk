# Contributing Guide

> How to contribute to the AI Monitor SDK — development setup, project structure, coding standards, testing, and release process.

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9

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
├── packages/
│   ├── ai-monitor-core/           # Core monitoring engine
│   │   ├── src/
│   │   │   ├── monitor.ts         # AIMonitor class
│   │   │   ├── ai-service.ts      # AIService (LLM integration)
│   │   │   ├── config-builder.ts  # Fluent ConfigBuilder
│   │   │   ├── logger-adapter.ts  # Console + Winston adapters
│   │   │   ├── types.ts           # Core interfaces (INotifier, IAlert, etc.)
│   │   │   ├── ai-types.ts        # AI-specific types (IAIAnalysis, etc.)
│   │   │   ├── index.ts           # Public API barrel
│   │   │   └── __tests__/         # Unit tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-monitor-notifiers/      # Notification channels
│   │   ├── src/
│   │   │   ├── telegram-notifier.ts
│   │   │   ├── slack-notifier.ts
│   │   │   ├── email-notifier.ts
│   │   │   ├── multi-notifier.ts
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   └── ai-monitor-instrumentation/  # Auto-instrumentation
│       ├── src/
│       │   ├── instrumentation.ts    # Main orchestrator
│       │   ├── system-metrics.ts     # CPU/memory collector
│       │   ├── http-interceptor.ts   # HTTP middleware
│       │   ├── error-interceptor.ts  # Uncaught error handler
│       │   ├── performance-monitor.ts# Operation timing
│       │   ├── metric-aggregator.ts  # P95 + error rate windows
│       │   ├── prometheus-exporter.ts# /metrics endpoint
│       │   ├── resource-monitor.ts   # DB + queue monitoring
│       │   ├── types.ts
│       │   ├── index.ts
│       │   └── __tests__/
│       └── package.json
│
├── examples/
│   └── standalone-service/        # Production-ready example
│
├── .github/workflows/
│   ├── ci.yml                     # Lint → Build → Test
│   └── publish.yml                # Tag-triggered npm publish
│
├── docker-compose.yml             # Monitor + Prometheus + Grafana
├── Dockerfile                     # Multi-stage production build
├── prometheus/prometheus.yml      # Scrape config
├── grafana/provisioning/          # Auto-provisioned datasources
├── jest.config.js                 # Root test config
├── pnpm-workspace.yaml            # Monorepo workspace
└── package.json                   # Root scripts
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

- `ai-monitor-core` — **zero runtime deps**, self-contained
- `ai-monitor-notifiers` — depends on `core` (dev), optional peers: `telegram`, `axios`, `nodemailer`
- `ai-monitor-instrumentation` — depends on `core` (peer + dev)
- `examples/standalone-service` — depends on `core` + `notifiers`

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

- `dist/index.js` — CommonJS
- `dist/index.mjs` — ESM
- `dist/index.d.ts` — TypeScript declarations

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
  '^@aker/ai-monitor-core$': '<rootDir>/packages/ai-monitor-core/src',
  '^@aker/ai-monitor-notifiers$': '<rootDir>/packages/ai-monitor-notifiers/src',
  '^@aker/ai-monitor-instrumentation$': '<rootDir>/packages/ai-monitor-instrumentation/src',
}
```

---

## Creating a New Notifier

1. Create `packages/ai-monitor-notifiers/src/my-notifier.ts`
2. Implement `INotifier` from `@aker/ai-monitor-core`
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

MIT © AKER Team
