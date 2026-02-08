# API Reference — `@aker/ai-monitor-core`

> The brain of the SDK. Contains the monitoring server, AI analysis service, configuration builder, and all shared type contracts.

---

## `AIMonitor`

The central monitoring engine. Starts an HTTP server, routes alerts to configured notifiers, and optionally enriches them with AI analysis.

### Constructor

```typescript
new AIMonitor(config?: IMonitorConfig)
```

| Parameter                | Type                       | Default                   | Description                           |
| ------------------------ | -------------------------- | ------------------------- | ------------------------------------- |
| `host`                   | `string`                   | `'0.0.0.0'`               | Server bind address                   |
| `port`                   | `number`                   | `3333`                    | Server port                           |
| `enabled`                | `boolean`                  | `true`                    | Master enable/disable switch          |
| `notifiers`              | `INotifier \| INotifier[]` | `[]`                      | Notification channels                 |
| `logger`                 | `ILogger`                  | `ConsoleLogger`           | Custom logger implementation          |
| `aiConfig`               | `object`                   | `undefined`               | AI analysis configuration (see below) |
| `enableAIEnhancedAlerts` | `boolean`                  | `true` (if AI configured) | Enrich alerts with AI insights        |
| `enableHealthEndpoint`   | `boolean`                  | `true`                    | Expose `GET /health`                  |
| `enableAlertEndpoint`    | `boolean`                  | `true`                    | Expose `POST /alert`                  |
| `enablePipelineEndpoint` | `boolean`                  | `true`                    | Expose `POST /pipeline`               |
| `sendTestNotification`   | `boolean`                  | `false`                   | Send test message on startup          |
| `testNotificationDelay`  | `number`                   | `3000`                    | Delay (ms) before test notification   |

#### `aiConfig` Object

| Field                         | Type      | Default                       | Description               |
| ----------------------------- | --------- | ----------------------------- | ------------------------- |
| `apiKey`                      | `string`  | `process.env.AI_API_KEY`      | LLM provider API key      |
| `apiUrl`                      | `string`  | `'https://api.openai.com/v1'` | API endpoint URL          |
| `model`                       | `string`  | `'gpt-4o-mini'`               | Model identifier          |
| `enabled`                     | `boolean` | `true`                        | Enable AI analysis        |
| `features.anomalyDetection`   | `boolean` | `true`                        | Detect anomalies in data  |
| `features.rootCauseAnalysis`  | `boolean` | `true`                        | Analyze root causes       |
| `features.autoHealing`        | `boolean` | `true`                        | Suggest auto-fix commands |
| `features.patternRecognition` | `boolean` | `true`                        | Find recurring patterns   |

### Methods

#### `start(): Promise<void>`

Starts the HTTP server and begins listening for requests.

```typescript
await monitor.start();
// 🚀 AI Monitor started on http://0.0.0.0:3333
```

#### `stop(): Promise<void>`

Gracefully stops the server.

```typescript
await monitor.stop();
```

#### `alert(alert: IAlert): Promise<void>`

Sends an alert through all configured notifiers. If AI is enabled, the alert is enriched with root cause analysis, suggestions, and a confidence score before delivery.

```typescript
await monitor.alert({
  severity: "CRITICAL", // 'INFO' | 'WARNING' | 'CRITICAL'
  title: "Database Down",
  message: "Connection refused on port 5432",
  metrics: { host: "db-1", retries: 3 },
  timestamp: new Date(), // optional, defaults to now
});
```

#### `pipelineStatus(status: IPipelineStatus): Promise<void>`

Sends a CI/CD pipeline status notification.

```typescript
await monitor.pipelineStatus({
  jobName: "deploy-production",
  buildNumber: "142",
  status: "SUCCESS", // 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE'
  duration: 312, // seconds
  url: "https://ci.example.com/build/142",
  changes: ["Fix auth bug", "Update deps"],
});
```

#### `deployment(deployment: IDeployment): Promise<void>`

Sends a deployment notification.

```typescript
await monitor.deployment({
  environment: "production",
  version: "2.1.0",
  status: "SUCCESS", // 'SUCCESS' | 'FAILURE'
  duration: 45,
  url: "https://app.example.com",
  changes: ["New payment flow", "Performance fixes"],
});
```

#### `dailyReport(report: IDailyReport): Promise<void>`

Sends a daily summary report.

```typescript
await monitor.dailyReport({
  date: new Date(),
  totalAlerts: 12,
  criticalAlerts: 1,
  autoFixes: 3,
  uptime: "99.97%",
  topIssues: ["Memory spike at 03:00", "Slow DB queries"],
});
```

#### `notify(message: string): Promise<void>`

Sends a raw text message through all notifiers.

```typescript
await monitor.notify("🚀 Deployment v2.1.0 complete!");
```

---

## `AIService`

LLM-powered analysis engine. Uses the OpenAI Chat Completions API (or any compatible endpoint) to analyze logs, metrics, and errors.

### Constructor

```typescript
new AIService(config?: IAIConfig)
```

> **Note:** Requires `axios` as a peer dependency. If axios is not installed, the service disables itself gracefully and returns fallback analysis results.

### Methods

| Method                             | Input           | Description                        |
| ---------------------------------- | --------------- | ---------------------------------- |
| `analyzeLog(log)`                  | `ILogEntry`     | Analyze a single log entry         |
| `analyzeLogs(logs)`                | `ILogEntry[]`   | Analyze multiple logs for patterns |
| `analyzeMetrics(metrics)`          | `IMetricData[]` | Detect metric anomalies            |
| `analyzeError(error, context?)`    | `Error`         | Root cause analysis for an error   |
| `detectAnomalies(data)`            | `any[]`         | General anomaly detection          |
| `suggestAutoHeal(issue, context?)` | `string`        | Suggest auto-healing commands      |

### Return Type: `IAIAnalysis`

Every method returns a structured analysis:

```typescript
interface IAIAnalysis {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  rootCause?: string;
  suggestions?: string[];
  isAnomaly?: boolean;
  confidence?: number; // 0–1
  relatedPatterns?: string[];
  autoHealCommand?: string;
}
```

---

## `ConfigBuilder`

Fluent configuration builder with environment variable auto-loading.

### Usage

```typescript
import { createConfig } from "@aker/ai-monitor-core";

const config = createConfig({ fromEnv: true })
  .port(4000)
  .enabled(true)
  .addNotifier(telegramNotifier)
  .addNotifier(slackNotifier)
  .sendTestNotification(true, 5000)
  .build();
```

### Methods

| Method                               | Returns          | Description               |
| ------------------------------------ | ---------------- | ------------------------- |
| `host(host)`                         | `this`           | Set server host           |
| `port(port)`                         | `this`           | Set server port           |
| `enabled(bool)`                      | `this`           | Enable/disable monitoring |
| `addNotifier(notifier)`              | `this`           | Append a notifier         |
| `notifiers(notifiers)`               | `this`           | Replace all notifiers     |
| `logger(logger)`                     | `this`           | Set custom logger         |
| `enableHealthEndpoint(bool)`         | `this`           | Toggle `/health`          |
| `enableAlertEndpoint(bool)`          | `this`           | Toggle `POST /alert`      |
| `enablePipelineEndpoint(bool)`       | `this`           | Toggle `POST /pipeline`   |
| `sendTestNotification(bool, delay?)` | `this`           | Send test on startup      |
| `build()`                            | `IMonitorConfig` | Return the built config   |

### Environment Variable Mapping

When `fromEnv: true`, the builder reads variables with the configured prefix (default `AI_MONITOR_`):

| Variable                              | Maps To                  |
| ------------------------------------- | ------------------------ |
| `AI_MONITOR_HOST`                     | `host`                   |
| `AI_MONITOR_PORT`                     | `port`                   |
| `AI_MONITOR_ENABLED`                  | `enabled`                |
| `AI_MONITOR_ENABLE_HEALTH_ENDPOINT`   | `enableHealthEndpoint`   |
| `AI_MONITOR_ENABLE_ALERT_ENDPOINT`    | `enableAlertEndpoint`    |
| `AI_MONITOR_ENABLE_PIPELINE_ENDPOINT` | `enablePipelineEndpoint` |
| `AI_MONITOR_SEND_TEST_NOTIFICATION`   | `sendTestNotification`   |
| `AI_MONITOR_TEST_NOTIFICATION_DELAY`  | `testNotificationDelay`  |

---

## Logger Adapters

### `ConsoleLogger`

Default logger. Wraps `console.log/warn/error/debug` with level prefixes.

### `WinstonLoggerAdapter`

Adapts any Winston logger instance to the `ILogger` interface:

```typescript
import winston from "winston";
import { WinstonLoggerAdapter } from "@aker/ai-monitor-core";

const adapter = new WinstonLoggerAdapter(
  winston.createLogger({
    /* ... */
  }),
);
```

### `ILogger` Interface

Implement this to create your own adapter:

```typescript
interface ILogger {
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
}
```

---

## Type Reference

### `INotifier`

The contract that all notification channels must implement:

```typescript
interface INotifier {
  send(message: string): Promise<void>;
  sendAlert(alert: IAlert): Promise<void>;
  sendPipelineStatus(status: IPipelineStatus): Promise<void>;
  sendDeploymentNotification(deployment: IDeployment): Promise<void>;
  sendDailyReport(report: IDailyReport): Promise<void>;
}
```

### `IAlert`

```typescript
interface IAlert {
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  metrics?: Record<string, any>;
  timestamp?: Date;
}
```

### `IPipelineStatus`

```typescript
interface IPipelineStatus {
  jobName: string;
  buildNumber: string;
  status: "SUCCESS" | "FAILURE" | "ABORTED" | "UNSTABLE";
  duration?: number;
  url?: string;
  changes?: string[];
}
```

### `IDeployment`

```typescript
interface IDeployment {
  environment: string;
  version: string;
  status: "SUCCESS" | "FAILURE";
  duration?: number;
  url?: string;
  changes?: string[];
}
```

### `IDailyReport`

```typescript
interface IDailyReport {
  date: Date;
  totalAlerts: number;
  criticalAlerts: number;
  autoFixes: number;
  uptime: string;
  topIssues: string[];
}
```

### `ILogEntry`

```typescript
interface ILogEntry {
  timestamp: Date;
  level: string;
  message: string;
  context?: string;
  stack?: string;
  metadata?: Record<string, any>;
}
```

### `IMetricData`

```typescript
interface IMetricData {
  name: string;
  value: number;
  timestamp: Date;
  unit?: string;
  tags?: Record<string, string>;
}
```

---

## `AlertDeduplicator`

Prevents notification storms by suppressing identical alerts within a configurable cooldown window.

### Constructor

```typescript
new AlertDeduplicator(config?: IDeduplicationConfig)
```

| Parameter    | Type      | Default  | Description                        |
| ------------ | --------- | -------- | ---------------------------------- |
| `enabled`    | `boolean` | `true`   | Enable deduplication               |
| `cooldownMs` | `number`  | `300000` | Cooldown window in ms (default 5m) |

### Methods

| Method                      | Returns   | Description                              |
| --------------------------- | --------- | ---------------------------------------- |
| `shouldSend(alert)`         | `boolean` | Returns `true` if the alert should fire  |
| `reset()`                   | `void`    | Clear all cooldown state                 |
| `resetKey(severity, title)` | `void`    | Clear cooldown for a specific alert type |
| `suppressedCount` (getter)  | `number`  | Count of suppressed alerts               |

### Usage

```typescript
const monitor = new AIMonitor({
  deduplication: { enabled: true, cooldownMs: 300_000 }, // 5min window
});

// First alert fires → notifiers called
await monitor.alert({ severity: "CRITICAL", title: "DB Down", message: "..." });

// Same alert within 5 minutes → suppressed, no notification
await monitor.alert({ severity: "CRITICAL", title: "DB Down", message: "..." });
```

> **Note:** The deduplicator is automatically integrated into `AIMonitor.alert()`. You don't call it directly unless building custom pipelines.

---

## `HealthProbeManager`

Active health probing for external dependencies. Supports HTTP, TCP, and custom probe types with auto-alerting on failure and recovery.

### Probe Types

| Type     | What It Does                             | Required Config |
| -------- | ---------------------------------------- | --------------- |
| `http`   | Sends GET request, checks for 2xx status | `url`           |
| `tcp`    | Opens TCP socket, checks connectivity    | `host`, `port`  |
| `custom` | Calls your function, checks return value | `checkFn`       |

### Configuration

```typescript
interface IProbeConfig {
  name: string; // Probe identifier
  type: "http" | "tcp" | "custom"; // Probe type
  url?: string; // For HTTP probes
  host?: string; // For TCP probes
  port?: number; // For TCP probes
  intervalMs?: number; // Check interval (default: 30000)
  timeoutMs?: number; // Check timeout (default: 5000)
  consecutiveFailuresForCritical?: number; // Failures before CRITICAL (default: 3)
  checkFn?: () => Promise<{ healthy: boolean; message?: string }>;
}
```

### Usage

```typescript
const monitor = new AIMonitor({
  probes: [
    { name: "postgres", type: "tcp", host: "localhost", port: 5432 },
    { name: "redis", type: "tcp", host: "localhost", port: 6379 },
    { name: "stripe-api", type: "http", url: "https://api.stripe.com/v1" },
    {
      name: "disk-space",
      type: "custom",
      checkFn: async () => {
        const free = await getDiskFreePercent();
        return { healthy: free > 10, message: `${free}% free` };
      },
    },
  ],
});
```

### Alert Behavior

| Condition                        | Severity   | When                                    |
| -------------------------------- | ---------- | --------------------------------------- |
| First failure                    | `WARNING`  | Immediately on first failed check       |
| Consecutive failures ≥ threshold | `CRITICAL` | After N consecutive failures            |
| Recovery                         | `INFO`     | When a previously-failed probe succeeds |

### Health Endpoint

Probe status is included in the `/health` response:

```json
{
  "status": "healthy",
  "probes": {
    "postgres": { "healthy": true, "consecutiveFailures": 0 },
    "redis": { "healthy": false, "lastError": "Connection refused" }
  }
}
```

---

## `PluginManager` / Plugin System

Extend the SDK at runtime with the `monitor.use()` API. Plugins can hook into any point in the monitor lifecycle.

### `IPlugin` Interface

```typescript
interface IPlugin {
  name: string;
  onInit?(monitor: IAIMonitorRef): void | Promise<void>;
  onStart?(monitor: IAIMonitorRef): void | Promise<void>;
  onStop?(monitor: IAIMonitorRef): void | Promise<void>;
  onAlert?(
    alert: IAlert,
    monitor: IAIMonitorRef,
  ): IAlert | null | Promise<IAlert | null>;
  onBeforeNotify?(
    alert: IAlert,
    monitor: IAIMonitorRef,
  ): boolean | Promise<boolean>;
}
```

### Lifecycle Hooks

| Hook             | When                         | Can Cancel/Modify?                                               |
| ---------------- | ---------------------------- | ---------------------------------------------------------------- |
| `onInit`         | Plugin is registered         | No                                                               |
| `onStart`        | `monitor.start()` is called  | No                                                               |
| `onStop`         | `monitor.stop()` is called   | No                                                               |
| `onAlert`        | Before notification          | ✅ Return `null` to suppress, return modified alert to change it |
| `onBeforeNotify` | After `onAlert`, before send | ✅ Return `false` to suppress                                    |

### Usage

```typescript
// Create a plugin
const rateLimiter: IPlugin = {
  name: "rate-limiter",
  onAlert: (alert) => {
    if (alertCount > 100) return null; // Suppress
    return alert;
  },
};

// Register via constructor
const monitor = new AIMonitor({ plugins: [rateLimiter] });

// Or register at runtime
await monitor.use(rateLimiter);
```

### ConfigBuilder

```typescript
const config = createConfig()
  .addPlugin(rateLimiter)
  .addPlugin(customEnricher)
  .build();
```

---

## `validateConfig()`

Runtime validation of `IMonitorConfig`. Called automatically in the `AIMonitor` constructor — invalid configs throw with clear error messages.

### Usage

```typescript
import { validateConfig } from "@aker/ai-monitor-core";

const result = validateConfig(myConfig);
// result.valid → boolean
// result.errors → string[] of human-readable messages
```

### Validated Fields

| Field           | Check                                    |
| --------------- | ---------------------------------------- |
| `port`          | Number, 1–65535                          |
| `host`          | String                                   |
| `enabled`       | Boolean                                  |
| `notifiers`     | Array of objects with `sendAlert` method |
| `aiConfig`      | If `enabled`, must have `apiKey`         |
| `deduplication` | `cooldownMs` must be positive            |
| `plugins`       | Each must have non-empty `name`          |

---

## Updated `ConfigBuilder` Methods

The ConfigBuilder now includes methods for the new features:

| Method                              | Returns | Description                   |
| ----------------------------------- | ------- | ----------------------------- |
| `deduplication(enabled, cooldown?)` | `this`  | Configure alert deduplication |
| `addPlugin(plugin)`                 | `this`  | Add a plugin                  |

```typescript
const config = createConfig()
  .port(3333)
  .deduplication(true, 300_000)
  .addPlugin(myPlugin)
  .build();
```
