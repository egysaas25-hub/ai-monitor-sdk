# @aker/ai-monitor-core

> **Plug-and-play AI monitoring for any Node.js application**  
> Drop it in. Configure once. Monitor everywhere.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🔌 **True Plug-and-Play** - Install and start monitoring in 5 lines of code
- 🎯 **Zero Configuration Required** - Sensible defaults, configure only what you need
- 🔧 **Fully Pluggable** - Bring your own logger, notifiers, or use ours
- 📊 **HTTP API Built-in** - Ready-to-use endpoints for alerts, health checks, and CI/CD
- 🎨 **TypeScript Native** - Full type safety with comprehensive type definitions
- 🚀 **Framework Agnostic** - Works with Express, NestJS, vanilla Node.js, or anything else

---

## 📦 Installation

```bash
npm install @aker/ai-monitor-core
# or
pnpm add @aker/ai-monitor-core
# or
yarn add @aker/ai-monitor-core
```

---

## 🚀 Quick Start

### Minimal Setup (30 seconds)

```typescript
import { AIMonitor } from "@aker/ai-monitor-core";

const monitor = new AIMonitor();
await monitor.start();

// That's it! Monitor is running on http://localhost:3333
```

### With Notifiers

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

// Send an alert
await monitor.alert({
  severity: "CRITICAL",
  title: "Database Connection Lost",
  message: "Primary database is unreachable",
});
```

### With Custom Logger

```typescript
import { AIMonitor, WinstonLoggerAdapter } from "@aker/ai-monitor-core";
import winston from "winston";

const logger = winston.createLogger({
  /* your config */
});

const monitor = new AIMonitor({
  logger: new WinstonLoggerAdapter(logger),
});

await monitor.start();
```

### Using Configuration Builder

```typescript
import { AIMonitor, createConfig } from "@aker/ai-monitor-core";
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";

const config = createConfig()
  .port(4000)
  .host("0.0.0.0")
  .addNotifier(
    new TelegramNotifier({
      /* ... */
    }),
  )
  .sendTestNotification(true, 2000)
  .build();

const monitor = new AIMonitor(config);
await monitor.start();
```

### Load from Environment Variables

```typescript
import { createConfig } from "@aker/ai-monitor-core";

const config = createConfig({
  fromEnv: true,
  envPrefix: "AI_MONITOR_",
}).build();
const monitor = new AIMonitor(config);
```

**Environment Variables:**

- `AI_MONITOR_HOST` - Server host (default: `0.0.0.0`)
- `AI_MONITOR_PORT` - Server port (default: `3333`)
- `AI_MONITOR_ENABLED` - Enable/disable monitoring (default: `true`)

---

## 📚 API Reference

### AIMonitor Class

#### Constructor

```typescript
new AIMonitor(config?: IMonitorConfig)
```

#### Methods

```typescript
// Start the monitoring server
await monitor.start(): Promise<void>

// Stop the monitoring server
await monitor.stop(): Promise<void>

// Send an alert
await monitor.alert(alert: IAlert): Promise<void>

// Send pipeline status
await monitor.pipelineStatus(status: IPipelineStatus): Promise<void>

// Send deployment notification
await monitor.deployment(deployment: IDeployment): Promise<void>

// Send daily report
await monitor.dailyReport(report: IDailyReport): Promise<void>

// Send raw message
await monitor.notify(message: string): Promise<void>
```

### Configuration Interface

```typescript
interface IMonitorConfig {
  host?: string; // Server host (default: '0.0.0.0')
  port?: number; // Server port (default: 3333)
  enabled?: boolean; // Enable monitoring (default: true)
  notifiers?: INotifier | INotifier[]; // Notification providers
  logger?: ILogger; // Custom logger implementation
  enableHealthEndpoint?: boolean; // Enable /health (default: true)
  enableAlertEndpoint?: boolean; // Enable /alert (default: true)
  enablePipelineEndpoint?: boolean; // Enable /pipeline (default: true)
  sendTestNotification?: boolean; // Send test on startup (default: false)
  testNotificationDelay?: number; // Delay for test notification (default: 3000)
}
```

### HTTP Endpoints

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "enabled": true,
  "notifiers": 1,
  "timestamp": "2026-02-04T20:00:00.000Z"
}
```

#### Send Alert

```http
POST /alert
Content-Type: application/json

{
  "severity": "CRITICAL",
  "title": "High Error Rate",
  "message": "Error rate exceeded threshold",
  "metrics": {
    "error_rate": 0.15,
    "requests": 1000
  }
}
```

#### Pipeline Status

```http
POST /pipeline
Content-Type: application/json

{
  "jobName": "Backend Build",
  "buildNumber": "123",
  "status": "SUCCESS",
  "duration": 120,
  "url": "http://jenkins.example.com/job/backend/123/"
}
```

---

## 🔌 Creating Custom Notifiers

Implement the `INotifier` interface:

```typescript
import type { INotifier, IAlert } from "@aker/ai-monitor-core";

class CustomNotifier implements INotifier {
  async send(message: string): Promise<void> {
    // Your implementation
  }

  async sendAlert(alert: IAlert): Promise<void> {
    // Your implementation
  }

  async sendPipelineStatus(status: IPipelineStatus): Promise<void> {
    // Your implementation
  }

  async sendDeploymentNotification(deployment: IDeployment): Promise<void> {
    // Your implementation
  }

  async sendDailyReport(report: IDailyReport): Promise<void> {
    // Your implementation
  }
}
```

---

## 🎯 Use Cases

### Express.js Integration

```typescript
import express from "express";
import { AIMonitor } from "@aker/ai-monitor-core";

const app = express();
const monitor = new AIMonitor({ port: 4000 });

// Error monitoring middleware
app.use((err, req, res, next) => {
  monitor.alert({
    severity: "CRITICAL",
    title: "Express Error",
    message: err.message,
    metrics: { stack: err.stack },
  });
  next(err);
});

await monitor.start();
app.listen(3000);
```

### NestJS Integration

```typescript
import { Module } from "@nestjs/common";
import { AIMonitor } from "@aker/ai-monitor-core";

const monitorProvider = {
  provide: "AI_MONITOR",
  useFactory: async () => {
    const monitor = new AIMonitor();
    await monitor.start();
    return monitor;
  },
};

@Module({
  providers: [monitorProvider],
  exports: ["AI_MONITOR"],
})
export class MonitoringModule {}
```

### CI/CD Integration (GitHub Actions)

```yaml
- name: Notify AI Monitor
  run: |
    curl -X POST http://monitor.example.com:3333/pipeline \
      -H 'Content-Type: application/json' \
      -d '{
        "jobName": "${{ github.workflow }}",
        "buildNumber": "${{ github.run_number }}",
        "status": "SUCCESS"
      }'
```

---

## 📖 Related Packages

- **[@aker/ai-monitor-notifiers](../ai-monitor-notifiers)** - Telegram, Slack, Email notifiers

---

## 📝 License

MIT © AKER Team

---

## 🤝 Contributing

Contributions are welcome! This is a plug-and-play module - help us make it even easier to use.

---

**Made with ❤️ by the AKER Team**
