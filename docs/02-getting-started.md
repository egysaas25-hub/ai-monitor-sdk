# Getting Started

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (recommended) or npm/yarn

---

## Installation

### As a Library (in your project)

Install only the packages you need:

```bash
# Core + Notifiers (most common)
pnpm add @aker/ai-monitor-core @aker/ai-monitor-notifiers

# Full stack: Core + Notifiers + Auto-Instrumentation
pnpm add @aker/ai-monitor-core @aker/ai-monitor-notifiers @aker/ai-monitor-instrumentation
```

Install optional peer dependencies for your chosen notifiers:

```bash
# Telegram
pnpm add telegram

# Slack (or AI analysis)
pnpm add axios

# Email
pnpm add nodemailer

# Custom logger
pnpm add winston
```

### Monorepo Development

```bash
git clone https://github.com/AKER-LINK/ai-monitor-sdk.git
cd ai-monitor-sdk
pnpm install
pnpm run build
pnpm run test
```

---

## Quick Start — 5 Minutes to Monitoring

### Step 1: Basic Monitor with Telegram

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
});

await monitor.start();
// 🚀 AI Monitor started on http://0.0.0.0:3333
// 📊 Health check: http://0.0.0.0:3333/health
```

### Step 2: Send Your First Alert

```typescript
await monitor.alert({
  severity: "WARNING",
  title: "High Memory Usage",
  message: "Memory usage at 85% — potential leak detected",
  metrics: { heapUsed: "1.2GB", heapTotal: "1.4GB" },
});
```

### Step 3: Add Auto-Instrumentation

```typescript
import { Instrumentation } from "@aker/ai-monitor-instrumentation";

const instrumentation = new Instrumentation({
  monitor,
  appName: "my-api",
  thresholds: {
    cpu: { warning: 0.5, critical: 0.7 },
    memory: { warning: 0.6, critical: 0.8 },
    responseTime: { warning: 200, critical: 500 },
    errorRate: { warning: 0.1, critical: 1.0 },
  },
});

instrumentation.start();

// Express middleware — auto-tracks all HTTP requests + exposes /metrics
app.use(instrumentation.httpMiddleware());
```

### Step 4: Enable AI-Powered Analysis

```typescript
const monitor = new AIMonitor({
  port: 3333,
  notifiers: [
    /* ... */
  ],
  aiConfig: {
    enabled: true,
    apiKey: process.env.AI_API_KEY,
    apiUrl: "https://api.openai.com/v1", // or any compatible API
    model: "gpt-4o-mini",
    features: {
      anomalyDetection: true,
      rootCauseAnalysis: true,
      autoHealing: true,
      patternRecognition: true,
    },
  },
});
```

With AI enabled, every alert is enriched with:

- 🤖 **Root cause analysis** — why it happened
- 💡 **Fix suggestions** — actionable steps
- 📊 **Confidence score** — how certain the AI is
- 🔧 **Auto-heal command** — a command to fix it (when applicable)

---

## Using the Fluent Config Builder

For complex setups, the `ConfigBuilder` provides a chainable API:

```typescript
import { createConfig, AIMonitor } from "@aker/ai-monitor-core";
import { TelegramNotifier, SlackNotifier } from "@aker/ai-monitor-notifiers";

const config = createConfig({ fromEnv: true, envPrefix: "AI_MONITOR_" })
  .port(3333)
  .enabled(true)
  .addNotifier(new TelegramNotifier({ token: "...", chatId: "..." }))
  .addNotifier(new SlackNotifier({ webhookUrl: "..." }))
  .enableHealthEndpoint(true)
  .enableAlertEndpoint(true)
  .sendTestNotification(true, 5000)
  .build();

const monitor = new AIMonitor(config);
await monitor.start();
```

When `fromEnv: true` is set, the builder automatically reads environment variables with the specified prefix (default: `AI_MONITOR_`).

---

## Using a Custom Logger

### Winston Integration

```typescript
import winston from "winston";
import { AIMonitor, WinstonLoggerAdapter } from "@aker/ai-monitor-core";

const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "monitor.log" }),
  ],
});

const monitor = new AIMonitor({
  logger: new WinstonLoggerAdapter(logger),
  // ...
});
```

### Custom Logger

Implement the `ILogger` interface:

```typescript
import type { ILogger } from "@aker/ai-monitor-core";

class MyLogger implements ILogger {
  info(message: string, ...meta: any[]) {
    /* your logic */
  }
  warn(message: string, ...meta: any[]) {
    /* your logic */
  }
  error(message: string, ...meta: any[]) {
    /* your logic */
  }
  debug(message: string, ...meta: any[]) {
    /* your logic */
  }
}
```

---

## What's Next?

- **[API Reference — Core](./03-api-core.md)** — Full `AIMonitor`, `AIService`, `ConfigBuilder`, Plugins, Health Probes API
- **[API Reference — Notifiers](./04-api-notifiers.md)** — Telegram, Slack, Email, Discord, Webhook, Multi-channel
- **[API Reference — Instrumentation](./05-api-instrumentation.md)** — Auto-instrumentation, Golden Signals, Tracing, Log Aggregation
- **[Configuration Guide](./06-configuration.md)** — All environment variables and options
- **[Deployment Guide](./07-deployment.md)** — Docker, Prometheus, Grafana setup

---

## Step 5: Enable Production-Grade Features

### Alert Deduplication

Prevent notification storms — same alert fires only once per cooldown window:

```typescript
const monitor = new AIMonitor({
  deduplication: { enabled: true, cooldownMs: 300_000 }, // 5min window
  // ...
});
```

### Health Check Probes

Actively monitor your external dependencies:

```typescript
const monitor = new AIMonitor({
  probes: [
    { name: "postgres", type: "tcp", host: "localhost", port: 5432 },
    { name: "redis", type: "tcp", host: "localhost", port: 6379 },
    { name: "stripe", type: "http", url: "https://api.stripe.com/v1" },
  ],
  // ...
});
// Probes auto-start with monitor.start() and alert on failure/recovery
```

### Plugin System

Extend the SDK without modifying core code:

```typescript
await monitor.use({
  name: "business-hours",
  onBeforeNotify: (alert) => {
    const hour = new Date().getHours();
    return alert.severity === "CRITICAL" || (hour >= 9 && hour <= 17);
  },
});
```

---

## Step 6: Add More Notification Channels

### Webhook (PagerDuty, Opsgenie, etc.)

```typescript
import { WebhookNotifier } from "@aker/ai-monitor-notifiers";

const pagerduty = new WebhookNotifier({
  url: "https://events.pagerduty.com/v2/enqueue",
  headers: { Authorization: `Token token=${process.env.PD_TOKEN}` },
  retries: 3,
});
```

### Discord

```typescript
import { DiscordNotifier } from "@aker/ai-monitor-notifiers";

const discord = new DiscordNotifier({
  webhookUrl: process.env.DISCORD_WEBHOOK_URL!,
  username: "AI Monitor",
});
```

---

## Step 7: Distributed Tracing & Log Aggregation

### Trace Requests Across Services

```typescript
import {
  traceMiddleware,
  TraceContext,
} from "@aker/ai-monitor-instrumentation";

// Add to your Express app
app.use(traceMiddleware());

// req.traceId is auto-attached. Forward to downstream services:
const traceparent = TraceContext.createTraceparent(TraceContext.current()!);
```

### Capture & Query Logs

```typescript
import { LogAggregator } from "@aker/ai-monitor-instrumentation";

const logs = new LogAggregator(10_000);
logs.interceptConsole(); // Captures console.log/warn/error/debug

// Query later
const errors = logs.query({ levels: ["error"], search: "timeout" });
```
