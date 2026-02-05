# @aker/ai-monitor-instrumentation

**Plug-and-play auto-instrumentation for any Node.js application**

Drop it in, start it, and your entire application is automatically monitored - errors, performance, HTTP requests, system metrics - everything!

## 🎯 Golden Signals Monitoring

Automatically tracks the four golden signals with industry-standard thresholds:

| Metric                  | Good    | Warning   | Critical | Action               |
| ----------------------- | ------- | --------- | -------- | -------------------- |
| **Response Time (P95)** | < 200ms | 200-500ms | > 500ms  | `Optimize queries`   |
| **Error Rate**          | < 0.1%  | 0.1-1%    | > 1%     | `Investigate errors` |
| **CPU Usage**           | < 50%   | 50-70%    | > 70%    | `Scale up`           |
| **Memory Usage**        | < 60%   | 60-80%    | > 80%    | `Check for leaks`    |
| **DB Connections**      | < 50%   | 50-80%    | > 80%    | `Increase pool`      |
| **Queue Length**        | < 100   | 100-1000  | > 1000   | `Add workers`        |

### Prometheus Integration

Just add the middleware, and you get a compatible `/metrics` endpoint automatically!

```typescript
// Exposed at http://localhost:3000/metrics
// Scrape this with Prometheus!
```

## 🎯 What It Does

Automatically monitors:

- ✅ **All errors** (uncaught exceptions, unhandled rejections)
- ✅ **Performance** (slow operations, function timings)
- ✅ **HTTP requests/responses** (latency, status codes, errors)
- ✅ **System metrics** (CPU, memory, uptime)
- ✅ **Database queries** (coming soon)

All without touching your application code!

## 📦 Installation

```bash
pnpm add @aker/ai-monitor-instrumentation @aker/ai-monitor-core @aker/ai-monitor-notifiers
```

## 🚀 Quick Start

```typescript
import { AIMonitor } from "@aker/ai-monitor-core";
import { Instrumentation } from "@aker/ai-monitor-instrumentation";
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";

// 1. Create monitor
const monitor = new AIMonitor({
  notifiers: [
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
  ],
});

await monitor.start();

// 2. Create instrumentation
const instrumentation = new Instrumentation({
  monitor,
  appName: "my-app",
  environment: "production",
});

// 3. Start auto-monitoring
instrumentation.start();

// That's it! Your app is now fully monitored!
```

## 📊 What Gets Monitored Automatically

### Errors

All uncaught errors and unhandled promise rejections are automatically captured:

```typescript
// This error will be automatically caught and sent as an alert
throw new Error("Something broke!");

// This rejection too
Promise.reject(new Error("Async error"));
```

### Performance

Slow operations are automatically detected:

```typescript
// Manually measure something
await instrumentation.measure("database-query", async () => {
  return await db.query("SELECT * FROM users");
});

// Or use decorators (TypeScript)
class UserService {
  @instrumentation.performance.measureDecorator()
  async getUsers() {
    return await db.query("SELECT * FROM users");
  }
}
```

### HTTP Requests

**Express.js:**

```typescript
import express from "express";

const app = express();

// Add middleware - automatically monitors all requests
app.use(instrumentation.httpMiddleware());

app.get("/api/users", async (req, res) => {
  // Slow requests are automatically detected
  const users = await getUsers();
  res.json(users);
});
```

**Native Node.js:**

```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  res.end("Hello");
});

// Wrap the server
instrumentation.wrapHttpServer(server);
```

### System Metrics

CPU and memory are automatically monitored:

```typescript
// Automatic alerts when:
// - Memory usage > 90% (configurable)
// - CPU usage > 80% (configurable)
```

## ⚙️ Configuration

```typescript
const instrumentation = new Instrumentation({
  monitor, // Required: AIMonitor instance

  // Optional settings:
  appName: "my-app",
  environment: "production",

  // Enable/disable features
  captureErrors: true,
  capturePerformance: true,
  captureHttp: true,
  captureSystemMetrics: true,

  // Thresholds
  performanceThreshold: 1000, // Alert if operation > 1000ms
  memoryThreshold: 0.9, // Alert if memory > 90%
  cpuThreshold: 0.8, // Alert if CPU > 80%
  systemMetricsInterval: 60000, // Check every 60s

  // Error filter
  errorFilter: (error) => {
    // Return false to ignore certain errors
    return !error.message.includes("ECONNRESET");
  },
});
```

## 🎨 Framework Integration

### Express.js

```typescript
import express from "express";
import { Instrumentation } from "@aker/ai-monitor-instrumentation";

const app = express();

// Add monitoring middleware
app.use(instrumentation.httpMiddleware());

// All routes are now automatically monitored
app.get("/api/data", async (req, res) => {
  const data = await getData();
  res.json(data);
});
```

### NestJS

```typescript
import { NestFactory } from "@nestjs/core";
import { Instrumentation } from "@aker/ai-monitor-instrumentation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Start instrumentation
  instrumentation.start();

  // Wrap the HTTP server
  const server = app.getHttpServer();
  instrumentation.wrapHttpServer(server);

  await app.listen(3000);
}
```

### Fastify

```typescript
import Fastify from "fastify";

const fastify = Fastify();

// Wrap the server
instrumentation.wrapHttpServer(fastify.server);

// Start instrumentation
instrumentation.start();
```

## 🔧 Advanced Usage

### Manual Error Capture

```typescript
try {
  await riskyOperation();
} catch (error) {
  await instrumentation.captureError(error, {
    operation: "riskyOperation",
    userId: "123",
  });
}
```

### Track Outgoing HTTP Requests

```typescript
const tracker = instrumentation.trackHttpRequest(
  "https://api.example.com/data",
  {
    method: "GET",
  },
);

try {
  const response = await fetch("https://api.example.com/data");
  await tracker.end(response.status);
} catch (error) {
  await tracker.end(undefined, error);
}
```

### Performance Decorators

```typescript
class DataService {
  // Automatically measure this method
  @instrumentation.performance.measureDecorator("fetch-data")
  async fetchData() {
    return await api.getData();
  }
}
```

## 📈 What You Get

Once instrumentation is running, you'll automatically receive alerts for:

- ❌ **Uncaught errors** with stack traces
- 🐌 **Slow HTTP requests** (> threshold)
- 💾 **High memory usage** (> 90%)
- 🔥 **High CPU usage** (> 80%)
- 🚨 **500 errors** from your API
- ⏱️ **Slow operations** (> threshold)

All sent to your configured notifiers (Telegram, Slack, Email)!

## 🎯 Real-World Example

```typescript
// app.ts
import { AIMonitor } from '@aker/ai-monitor-core';
import { Instrumentation } from '@aker/ai-monitor-instrumentation';
import { TelegramNotifier } from '@aker/ai-monitor-notifiers';
import express from 'express';

// Setup monitoring
const monitor = new AIMonitor({
  aiConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: true
  },
  notifiers: [new TelegramNotifier({ ... })]
});

await monitor.start();

const instrumentation = new Instrumentation({
  monitor,
  appName: 'my-api',
  environment: 'production',
  performanceThreshold: 500  // Alert on requests > 500ms
});

instrumentation.start();

// Setup Express
const app = express();
app.use(instrumentation.httpMiddleware());

app.get('/api/users', async (req, res) => {
  // This is automatically monitored!
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});

app.listen(3000);

// Done! Your API is now fully monitored with:
// - Error tracking
// - Performance monitoring
// - HTTP request tracking
// - System metrics
// - AI-powered insights (if configured)
```

## 🏆 Benefits

1. **Zero Configuration** - Works out of the box
2. **Zero Code Changes** - No need to modify existing code
3. **Comprehensive** - Monitors everything automatically
4. **Actionable** - Get alerts only when something is wrong
5. **Extensible** - Can be customized for your needs

## 📝 License

MIT

---

Made with ❤️ by AKER Team
