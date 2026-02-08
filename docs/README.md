# @aker/ai-monitor-sdk — Documentation

> **Plug-and-play AI-powered monitoring for any Node.js application.**
> Drop it in, configure, and start monitoring with intelligent alerting, anomaly detection, and auto-healing suggestions.

---

## 📖 Table of Contents

| #   | Document                                             | Description                                                                    |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| 01  | [Architecture & Design](./01-architecture.md)        | High-level architecture, data flow diagrams, Golden Signals, package breakdown |
| 02  | [Getting Started](./02-getting-started.md)           | Installation, 5-minute quickstart, fluent builder, custom loggers              |
| 03  | [API — Core](./03-api-core.md)                       | `AIMonitor`, `AIService`, `ConfigBuilder`, all type interfaces                 |
| 04  | [API — Notifiers](./04-api-notifiers.md)             | Telegram, Slack, Email, Multi-channel, custom notifier guide                   |
| 05  | [API — Instrumentation](./05-api-instrumentation.md) | Auto-instrumentation, Prometheus, thresholds, collectors                       |
| 06  | [Configuration](./06-configuration.md)               | All environment variables, programmatic config, feature toggles                |
| 07  | [Deployment & Operations](./07-deployment.md)        | Docker, Prometheus, Grafana, CI/CD, health checks                              |
| 08  | [Examples & Recipes](./08-examples.md)               | Express, NestJS, CI/CD, DB/queue monitoring, webhooks                          |
| 09  | [Contributing](./09-contributing.md)                 | Dev setup, project structure, testing, coding standards, releases              |

---

## 📦 Packages

| Package                            | Description                                         | npm                                                                                                                              |
| ---------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `@aker/ai-monitor-core`            | Core monitoring engine, AI analysis, config builder | [![npm](https://img.shields.io/badge/npm-core-red)](https://www.npmjs.com/package/@aker/ai-monitor-core)                         |
| `@aker/ai-monitor-notifiers`       | Telegram, Slack, Email, Multi-channel               | [![npm](https://img.shields.io/badge/npm-notifiers-blue)](https://www.npmjs.com/package/@aker/ai-monitor-notifiers)              |
| `@aker/ai-monitor-instrumentation` | Auto-instrumentation, Prometheus, Golden Signals    | [![npm](https://img.shields.io/badge/npm-instrumentation-green)](https://www.npmjs.com/package/@aker/ai-monitor-instrumentation) |

---

## 🚀 30-Second Start

```bash
pnpm add @aker/ai-monitor-core @aker/ai-monitor-notifiers
```

```typescript
import { AIMonitor } from "@aker/ai-monitor-core";
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  notifiers: [new TelegramNotifier({ token: "...", chatId: "..." })],
});

await monitor.start();
await monitor.alert({
  severity: "WARNING",
  title: "Test",
  message: "It works!",
});
```

→ **[Full Getting Started Guide](./02-getting-started.md)**
