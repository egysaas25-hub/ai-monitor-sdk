# @momen124/ai-monitor-sdk — Documentation

> **Self-hostable AI SRE service — monitors any project, any stack, any architecture.**
> Delegating telemetry to OpenTelemetry and alertness to Keep, serving as the intelligent LLM brain for incident triage.

---

## ðŸ“– Table of Contents

| #   | Document                                             | Description                                                                    |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| 00  | [V2 Architecture Vision](./architecture/v2-vision.md) | **MUST READ:** The architectural shift from SDK to standalone AI SRE service.   |
| 01  | [Architecture & Design](./01-architecture.md)         | High-level architecture, OTel + SigNoz + Keep integrations, package breakdown    |
| 02  | [Getting Started](./02-getting-started.md)            | Installation, docker-compose quickstart, OTel instrumentation setup              |
| 03  | [API — Core](./03-api-core.md)                        | `ConfigBuilder`, Keep webhook receiver hooks, structural interfaces              |
| 04  | [API — Notifiers](./04-api-notifiers.md)             | Telegram, Slack, Email, Multi-channel, custom notifier guide                   |
| 05  | [API — Instrumentation](./05-api-instrumentation.md) | Auto-instrumentation, Prometheus, thresholds, collectors                       |
| 06  | [Configuration](./06-configuration.md)               | All environment variables, programmatic config, feature toggles                |
| 07  | [Deployment & Operations](./07-deployment.md)        | Docker, Prometheus, Grafana, CI/CD, health checks                              |
| 08  | [Examples & Recipes](./08-examples.md)               | Express, NestJS, CI/CD, DB/queue monitoring, webhooks                          |
| 09  | [Contributing](./09-contributing.md)                 | Dev setup, project structure, testing, coding standards, releases              |

---

## ðŸ“¦ Packages

| Package                            | Description                                         | npm                                                                                                                              |
| ---------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `@momen124/ai-monitor-ai`              | The LLM Brain. Context compression, PII redaction.  | [![npm](https://img.shields.io/badge/npm-ai-red)](#) |
| `@momen124/ai-monitor-otel`            | Thin OpenTelemetry config wrapper presets.          | [![npm](https://img.shields.io/badge/npm-otel-blue)](#) |
| `@momen124/ai-monitor-core`            | ConfigBuilder, Keep integration hooks.              | [![npm](https://img.shields.io/badge/npm-core-green)](#) |

---

## ðŸš€ 30-Second Start

```bash
pnpm add @momen124/ai-monitor-otel @opentelemetry/auto-instrumentations-node
```

```typescript
import { initTelemetry } from "@momen124/ai-monitor-otel";

// 1. Point our thin preset at your OTel Collector
initTelemetry({
  serviceName: "my-service",
  endpoint: "http://localhost:4318/v1/traces" 
});

// 2. That's it. Your infrastructure is monitored.
// Alerts and LLM triage happen externally in the AI Brain service.
```

â†’ **[Full Getting Started Guide](./02-getting-started.md)**
