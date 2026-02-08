# Examples & Recipes

> Real-world patterns and integration recipes for common scenarios.

---

## 1. Express API with Full Stack Monitoring

The most common use case — monitoring an Express API with all Golden Signals, AI analysis, and multi-channel notifications.

```typescript
import express from "express";
import { AIMonitor, WinstonLoggerAdapter } from "@aker/ai-monitor-core";
import {
  TelegramNotifier,
  SlackNotifier,
  EmailNotifier,
  MultiNotifier,
} from "@aker/ai-monitor-notifiers";
import { Instrumentation } from "@aker/ai-monitor-instrumentation";
import winston from "winston";

// 1. Create logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

// 2. Create notifiers
const notifiers = new MultiNotifier({
  notifiers: [
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
    new SlackNotifier({ webhookUrl: process.env.SLACK_WEBHOOK_URL! }),
    new EmailNotifier({
      host: "smtp.gmail.com",
      port: 587,
      auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASS! },
      from: "monitor@example.com",
      to: "ops@example.com",
    }),
  ],
  stopOnFirstError: false, // Continue even if one channel fails
});

// 3. Create monitor with AI
const monitor = new AIMonitor({
  port: 3333,
  notifiers: [notifiers],
  logger: new WinstonLoggerAdapter(logger),
  aiConfig: {
    enabled: true,
    apiKey: process.env.AI_API_KEY,
    model: "gpt-4o-mini",
  },
});

// 4. Create instrumentation
const instrumentation = new Instrumentation({
  monitor,
  appName: "my-express-api",
  environment: "production",
  thresholds: {
    responseTime: { warning: 200, critical: 500 },
    errorRate: { warning: 0.1, critical: 1.0 },
    cpu: { warning: 0.6, critical: 0.8 },
    memory: { warning: 0.7, critical: 0.9 },
  },
});

// 5. Wire it up
const app = express();
app.use(instrumentation.httpMiddleware()); // Auto-tracks all routes + serves /metrics

app.get("/api/users", async (req, res) => {
  const users = await instrumentation.measure("db.getUsers", () =>
    db.users.findMany(),
  );
  res.json(users);
});

// 6. Start everything
await monitor.start();
instrumentation.start();
app.listen(8080, () => logger.info("API running on :8080"));
```

---

## 2. NestJS Integration

```typescript
// monitoring.module.ts
import { Module, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { AIMonitor } from "@aker/ai-monitor-core";
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";
import { Instrumentation } from "@aker/ai-monitor-instrumentation";

@Module({})
export class MonitoringModule implements OnModuleInit, OnModuleDestroy {
  private monitor: AIMonitor;
  private instrumentation: Instrumentation;

  constructor() {
    this.monitor = new AIMonitor({
      port: 3333,
      notifiers: [
        new TelegramNotifier({
          token: process.env.TELEGRAM_BOT_TOKEN!,
          chatId: process.env.TELEGRAM_CHAT_ID!,
        }),
      ],
    });

    this.instrumentation = new Instrumentation({
      monitor: this.monitor,
      appName: "nestjs-api",
    });
  }

  async onModuleInit() {
    await this.monitor.start();
    this.instrumentation.start();
  }

  async onModuleDestroy() {
    this.instrumentation.stop();
    await this.monitor.stop();
  }
}
```

---

## 3. CI/CD Pipeline Notifications

Send build and deployment status from your CI pipeline:

```typescript
// In your deploy script
import { AIMonitor } from "@aker/ai-monitor-core";
import { SlackNotifier } from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  notifiers: [
    new SlackNotifier({ webhookUrl: process.env.SLACK_WEBHOOK_URL! }),
  ],
});
await monitor.start();

// After build
await monitor.pipelineStatus({
  jobName: "deploy-production",
  buildNumber: process.env.BUILD_NUMBER!,
  status: "SUCCESS",
  duration: 312,
  url: process.env.BUILD_URL,
  changes: ["Fix auth bug", "Update dependencies"],
});

// After deployment
await monitor.deployment({
  environment: "production",
  version: process.env.APP_VERSION!,
  status: "SUCCESS",
  url: "https://app.example.com",
});

await monitor.stop();
```

---

## 4. Monitoring External Resources (DB + Queue)

```typescript
import { Pool } from "pg";
import Redis from "ioredis";

const pgPool = new Pool({ max: 20 });
const redis = new Redis();

// After creating instrumentation...
instrumentation.monitorDbConnection(async () => {
  const { totalCount, idleCount } = pgPool;
  const activeCount = totalCount - idleCount;
  return (activeCount / 20) * 100; // percentage of max pool
});

instrumentation.monitorQueueLength(async () => {
  return await redis.llen("background-jobs");
});
```

---

## 5. Manual Performance Tracking

### Wrapping Functions

```typescript
// Automatically times the function and alerts if > threshold
const result = await instrumentation.measure(
  "stripe.createCharge",
  async () => {
    return await stripe.charges.create({ amount: 2000, currency: "usd" });
  },
  { customerId: "cus_123" },
);
```

### Split Timing

```typescript
instrumentation.startMeasure("data-migration");

// Phase 1
await migrateUsers();

// Phase 2
await migrateOrders();

await instrumentation.endMeasure("data-migration", {
  users: 50000,
  orders: 120000,
});
```

### Outgoing HTTP Tracking

```typescript
const tracker = instrumentation.trackHttpRequest(
  "https://api.stripe.com/v1/charges",
  { method: "POST" },
);

try {
  const response = await axios.post("https://api.stripe.com/v1/charges", data);
  await tracker.end(response.status);
} catch (error) {
  await tracker.end(undefined, error);
}
```

---

## 6. HTTP Webhook Receiver

Use the built-in HTTP endpoints to receive alerts from external systems:

```bash
# Send an alert via HTTP
curl -X POST http://localhost:3333/alert \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "CRITICAL",
    "title": "External System Down",
    "message": "Payment gateway returned 503"
  }'

# Send pipeline status
curl -X POST http://localhost:3333/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "jobName": "nightly-build",
    "buildNumber": "42",
    "status": "FAILURE",
    "duration": 180
  }'
```

---

## 7. Daily Report Automation

```typescript
import cron from "node-cron";

// Send daily report at 9 AM
cron.schedule("0 9 * * *", async () => {
  const stats = await getYesterdayStats(); // your function

  await monitor.dailyReport({
    date: new Date(),
    totalAlerts: stats.totalAlerts,
    criticalAlerts: stats.criticalAlerts,
    autoFixes: stats.autoFixes,
    uptime: stats.uptimePercentage,
    topIssues: stats.topIssues,
  });
});
```

---

## 8. Standalone Monitoring Service

Run the SDK as a standalone microservice that receives alerts via HTTP and forwards them to notification channels. See the included `examples/standalone-service/` for a production-ready example with:

- Winston logging with file rotation
- Telegram notifier auto-configured from env vars
- Graceful shutdown (SIGINT/SIGTERM)
- Docker + Docker Compose support
- Prometheus + Grafana stack

```bash
cd examples/standalone-service
cp .env.example .env
docker compose up -d
```
