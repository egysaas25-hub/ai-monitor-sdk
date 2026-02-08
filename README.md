# @aker/ai-monitor-sdk

[![CI](https://github.com/AKER-LINK/ai-monitor-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/AKER-LINK/ai-monitor-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Plug-and-play AI-powered monitoring for any Node.js application.** Drop it in, configure, and start monitoring with intelligent alerting, anomaly detection, and auto-healing suggestions.

---

## Architecture

```mermaid
graph TB
    subgraph "Your Application"
        APP[Node.js App]
    end

    subgraph "@aker/ai-monitor-sdk"
        CORE["@aker/ai-monitor-core<br/>AIMonitor · AIService · Deduplicator · Plugins · Probes"]
        INST["@aker/ai-monitor-instrumentation<br/>Golden Signals · TraceContext · LogAggregator"]
        NOTIF["@aker/ai-monitor-notifiers<br/>Telegram · Slack · Discord · Webhook · Email"]
    end

    subgraph "Observability Stack"
        PROM[Prometheus]
        GRAF[Grafana]
        AI[OpenAI / LLM API]
        WEBHOOK[External Webhooks]
    end

    APP --> INST
    INST --> CORE
    CORE --> NOTIF
    CORE --> AI
    NOTIF --> WEBHOOK
    INST --> PROM
    PROM --> GRAF

    style CORE fill:#1a1a2e,stroke:#e94560,color:#fff
    style INST fill:#1a1a2e,stroke:#0f3460,color:#fff
    style NOTIF fill:#1a1a2e,stroke:#16213e,color:#fff
```

## 📦 Packages

| Package                                                                       | Description                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **[@aker/ai-monitor-core](./packages/ai-monitor-core)**                       | Core monitoring, AI analysis, **Alert Deduplication**, **Health Probes**, **Plugin System** |
| **[@aker/ai-monitor-instrumentation](./packages/ai-monitor-instrumentation)** | Golden Signals, **Distributed Tracing**, **Log Aggregation**, Prometheus exporter           |
| **[@aker/ai-monitor-notifiers](./packages/ai-monitor-notifiers)**             | **Discord**, **Webhook**, Telegram, Slack, Email, Multi-channel                             |

## 🚀 Quickstart

### As a Library

```bash
pnpm add @aker/ai-monitor-core @aker/ai-monitor-notifiers
```

```typescript
import { AIMonitor } from "@aker/ai-monitor-core";
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  port: 3333,
  notifiers: [
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
  ],
  aiConfig: {
    enabled: true,
    apiKey: process.env.AI_API_KEY,
  },
});

await monitor.start();

// Send alerts manually
await monitor.alert({
  severity: "WARNING",
  title: "High Memory",
  message: "Memory usage at 85%",
});
```

### With Auto-Instrumentation

```typescript
import { Instrumentation } from "@aker/ai-monitor-instrumentation";

const instrumentation = new Instrumentation({
  monitor,
  appName: "my-api",
  thresholds: {
    cpu: { warning: 0.5, critical: 0.7 },
    memory: { warning: 0.6, critical: 0.8 },
  },
});

instrumentation.start();

// Express middleware — auto-tracks all HTTP requests
app.use(instrumentation.httpMiddleware());
```

### With Docker

```bash
cp .env.example .env
# Edit .env with your credentials

docker compose up -d
# Monitor:    http://localhost:3333/health
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage
```

## 📋 Environment Variables

See [`.env.example`](./.env.example) for all available configuration options.

## 🔄 CI/CD

- **CI**: Runs on every push to `main` and all PRs (Node 18 + 20)
- **Publish**: Triggered on Git tags `v*` — publishes all packages to npm

## 📖 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## 🚀 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for instructions on updating the SDK on your servers.

## 📄 License

MIT © AKER Team
