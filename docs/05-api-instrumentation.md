# API Reference — `@aker/ai-monitor-instrumentation`

> Auto-instrumentation layer for any Node.js application. Hooks into your app's runtime to collect Golden Signal metrics with zero code changes beyond a single middleware line.

---

## `Instrumentation`

The main orchestrator. Initializes and manages all internal collectors (system metrics, HTTP, errors, performance, metrics aggregation, Prometheus, external resources).

### Constructor

```typescript
new Instrumentation(config: IInstrumentationConfig)
```

#### `IInstrumentationConfig`

| Parameter               | Type                        | Default                  | Description                              |
| ----------------------- | --------------------------- | ------------------------ | ---------------------------------------- |
| `monitor`               | `AIMonitor`                 | **required**             | Core monitor instance for routing alerts |
| `enablePrometheus`      | `boolean`                   | `true`                   | Expose `/metrics` endpoint               |
| `thresholds`            | `IThresholds`               | see Golden Signals table | Custom warning/critical thresholds       |
| `captureErrors`         | `boolean`                   | `true`                   | Auto-capture uncaught exceptions         |
| `capturePerformance`    | `boolean`                   | `true`                   | Track operation timing                   |
| `captureHttp`           | `boolean`                   | `true`                   | Monitor HTTP requests                    |
| `captureDatabase`       | `boolean`                   | `true`                   | Monitor DB connections                   |
| `captureSystemMetrics`  | `boolean`                   | `true`                   | Poll CPU & memory                        |
| `systemMetricsInterval` | `number`                    | `60000`                  | Polling interval (ms)                    |
| `errorFilter`           | `(error: Error) => boolean` | `undefined`              | Return `false` to ignore an error        |
| `appName`               | `string`                    | `'unknown'`              | App name for alert context               |
| `environment`           | `string`                    | `process.env.NODE_ENV`   | Environment name                         |
| `performanceThreshold`  | `number`                    | `500`                    | Slow operation threshold (ms)            |

### Methods

#### `start(): void`

Starts all collectors (system metrics, error interceptor, metric aggregator, resource monitor).

```typescript
instrumentation.start();
// 🔍 Starting auto-instrumentation with Golden Signals...
// ✅ Golden Signals Monitoring Active
```

#### `stop(): void`

Stops all collectors and cleans up intervals/listeners.

#### `httpMiddleware()`

Returns Express/Connect-compatible middleware that:

1. Serves Prometheus metrics at `GET /metrics` (if enabled)
2. Times every HTTP request
3. Feeds the `MetricAggregator` (P95, error rate)
4. Feeds the `PrometheusExporter` (counters, histograms)
5. Runs the base `HttpInterceptor` logic (slow request / 5xx alerts)

```typescript
app.use(instrumentation.httpMiddleware());
```

#### `wrapHttpServer(server: http.Server): void`

Alternative to middleware — wraps a raw Node.js HTTP server's `emit` to instrument all requests:

```typescript
const server = http.createServer(app);
instrumentation.wrapHttpServer(server);
```

#### `measure<T>(operationName, fn, context?): Promise<T>`

Wraps a function and measures its execution time. Alerts if it exceeds `performanceThreshold`.

```typescript
const result = await instrumentation.measure(
  "heavy-computation",
  async () => await computeExpensiveResult(),
  { userId: "123" },
);
```

#### `startMeasure(operationName): void` / `endMeasure(operationName, context?): Promise<void>`

Manual start/end timing for operations that span multiple code paths:

```typescript
instrumentation.startMeasure("db-migration");
// ... run migration ...
await instrumentation.endMeasure("db-migration", { tables: 42 });
```

#### `captureError(error, context?): Promise<void>`

Manually capture an error (in addition to auto-captured uncaught exceptions):

```typescript
try {
  await riskyOperation();
} catch (error) {
  await instrumentation.captureError(error, { operation: "risky" });
}
```

#### `trackHttpRequest(url, options?)`

Track outgoing HTTP requests (fetch, axios, etc.):

```typescript
const tracker = instrumentation.trackHttpRequest(
  "https://api.stripe.com/charges",
  { method: "POST" },
);
try {
  const res = await fetch("https://api.stripe.com/charges", { method: "POST" });
  await tracker.end(res.status);
} catch (error) {
  await tracker.end(undefined, error);
}
```

#### `monitorDbConnection(fn): void`

Register a callback that returns the current DB connection count/percentage. Checked every 30 seconds.

```typescript
instrumentation.monitorDbConnection(async () => {
  const pool = await getPoolStatus();
  return (pool.active / pool.max) * 100; // return percentage
});
```

#### `monitorQueueLength(fn): void`

Register a callback to monitor job queue length. Checked every 30 seconds.

```typescript
instrumentation.monitorQueueLength(async () => {
  return await redis.llen("job-queue");
});
```

#### `performance`

Access the underlying `PerformanceMonitor` for decorator-based measurement:

```typescript
const perf = instrumentation.performance;
// Use perf.measureDecorator() for class method decoration
```

---

## Internal Components

These are exported for advanced use cases. Most users should use the `Instrumentation` class directly.

### `SystemMetricsCollector`

Polls `os.cpus()`, `os.totalmem()`, `os.freemem()`, and `process.cpuUsage()` at a configurable interval. Fires `WARNING` or `CRITICAL` alerts when CPU/memory thresholds are exceeded.

### `ErrorInterceptor`

Hooks into `process.on('uncaughtException')` and `process.on('unhandledRejection')`. Preserves original handlers. Supports custom error filtering via `errorFilter`.

### `PerformanceMonitor`

Manual and automatic operation timing. Provides:

- `measure()` — wrap a function
- `startMeasure()` / `endMeasure()` — split timing
- `measureDecorator()` — TypeScript method decorator

### `HttpInterceptor`

Express/Connect middleware and raw HTTP server wrapping. Alerts on:

- **Slow requests** — duration > `performanceThreshold`
- **5xx errors** — `CRITICAL` severity
- **4xx errors** — logged at debug level (no alert)

### `MetricAggregator`

Sliding-window aggregator (1-minute windows). Calculates:

- **P95 response time** — sorted array, 95th percentile index
- **Error rate** — `(errors / total) * 100`

Alerts when P95 or error rate exceeds configured thresholds.

### `PrometheusExporter`

Zero-dependency Prometheus text format exporter. Pre-registers these metrics:

| Metric Name                     | Type      | Description           |
| ------------------------------- | --------- | --------------------- |
| `http_request_duration_seconds` | histogram | HTTP request latency  |
| `http_requests_total`           | counter   | Total HTTP requests   |
| `process_cpu_usage_ratio`       | gauge     | CPU usage (0–1)       |
| `process_memory_usage_bytes`    | gauge     | Memory usage in bytes |
| `db_connections_active`         | gauge     | Active DB connections |
| `job_queue_length`              | gauge     | Current queue length  |

Custom metrics can be registered with:

```typescript
exporter.register("my_custom_metric", "Description", "gauge");
exporter.observe("my_custom_metric", 42, { app: "my-api" });
```

### `ExternalResourceMonitor`

Polls user-provided callbacks every 30 seconds for:

- **DB connections** (percentage or raw count)
- **Queue length** (raw count)

---

## Threshold Configuration

```typescript
interface IThresholds {
  responseTime?: { warning: number; critical: number }; // ms
  errorRate?: { warning: number; critical: number }; // percentage (0–100)
  cpu?: { warning: number; critical: number }; // ratio (0–1)
  memory?: { warning: number; critical: number }; // ratio (0–1)
  dbConnections?: { warning: number; critical: number }; // percentage or count
  queueLength?: { warning: number; critical: number }; // count
}
```

### Defaults

```typescript
{
  responseTime: { warning: 200, critical: 500 },    // ms
  errorRate:    { warning: 0.1, critical: 1.0 },     // %
  cpu:          { warning: 0.5, critical: 0.7 },     // 50%, 70%
  memory:       { warning: 0.6, critical: 0.8 },     // 60%, 80%
  dbConnections: { warning: 0.5, critical: 0.8 },    // 50%, 80%
  queueLength:  { warning: 100, critical: 1000 },    // count
}
```

---

## Type Reference

### `IPerformanceMetric`

```typescript
interface IPerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  context?: Record<string, any>;
}
```

### `IHttpMetric`

```typescript
interface IHttpMetric {
  method: string;
  url: string;
  statusCode?: number;
  duration: number;
  timestamp: Date;
  error?: string;
}
```

### `ISystemMetrics`

```typescript
interface ISystemMetrics {
  cpu: { usage: number; average: number };
  memory: { used: number; total: number; percentage: number };
  uptime: number;
  timestamp: Date;
}
```

---

## `TraceContext` — Distributed Tracing

W3C Trace Context implementation for tracking requests across microservices. Uses Node.js `AsyncLocalStorage` for zero-dependency context propagation.

### Trace ID Format (W3C `traceparent`)

```
00-{traceId 32hex}-{spanId 16hex}-{flags 2hex}
```

### Static Methods

| Method                     | Returns                      | Description                             |
| -------------------------- | ---------------------------- | --------------------------------------- |
| `generateTraceId()`        | `string`                     | Random 32-hex-char trace ID             |
| `generateSpanId()`         | `string`                     | Random 16-hex-char span ID              |
| `createTraceparent(ctx)`   | `string`                     | Build W3C traceparent header            |
| `parseTraceparent(header)` | `ITraceContext \| null`      | Parse traceparent header                |
| `current()`                | `ITraceContext \| undefined` | Get active trace from AsyncLocalStorage |
| `currentTraceId()`         | `string \| undefined`        | Get active trace ID                     |
| `run(ctx, fn)`             | `T`                          | Execute `fn` within a trace context     |
| `createChildSpan()`        | `ITraceContext \| null`      | Create child span under current         |

### `traceMiddleware()`

Express/Connect middleware that automatically:

1. Reads incoming `traceparent` header (or generates a new trace)
2. Stores context in `AsyncLocalStorage`
3. Sets `traceparent` response header
4. Attaches `req.traceId` and `req.traceContext`

```typescript
import {
  traceMiddleware,
  TraceContext,
} from "@aker/ai-monitor-instrumentation";

app.use(traceMiddleware());

app.get("/api/users", (req, res) => {
  console.log("Trace ID:", req.traceId); // Auto-attached

  // Access anywhere in the call stack
  const ctx = TraceContext.current();

  // Create child spans for sub-operations
  const child = TraceContext.createChildSpan();
  TraceContext.run(child!, async () => {
    await callDownstreamService();
  });
});
```

### Cross-Service Propagation

When calling downstream services, forward the `traceparent` header:

```typescript
const ctx = TraceContext.current();
const traceparent = TraceContext.createTraceparent(ctx!);

await fetch("https://service-b.internal/api", {
  headers: { traceparent },
});
```

---

## `LogAggregator`

In-memory ring buffer for capturing, storing, and querying application logs.

### Constructor

```typescript
new LogAggregator(maxEntries?: number) // Default: 10,000
```

### Methods

| Method                       | Returns       | Description                                 |
| ---------------------------- | ------------- | ------------------------------------------- |
| `capture(level, msg, meta?)` | `void`        | Manually add a log entry                    |
| `interceptConsole()`         | `void`        | Auto-capture `console.log/warn/error/debug` |
| `restoreConsole()`           | `void`        | Restore original console methods            |
| `query(opts?)`               | `ILogEntry[]` | Query logs with filters                     |
| `getRecentErrors(n?)`        | `ILogEntry[]` | Shorthand for error-level logs              |
| `clear()`                    | `void`        | Clear all buffered logs                     |
| `size` (getter)              | `number`      | Current buffer size                         |
| `toJSON()`                   | `ILogEntry[]` | Serializable snapshot                       |

### Query Options

```typescript
interface ILogQueryOptions {
  levels?: string[]; // Filter by level(s): ['error', 'warn']
  since?: Date; // Only logs after this date
  until?: Date; // Only logs before this date
  search?: string; // Substring match on message
  limit?: number; // Max results (default: 100)
}
```

### Usage

```typescript
import { LogAggregator } from "@aker/ai-monitor-instrumentation";

const logs = new LogAggregator(10_000);

// Option 1: Auto-capture console output
logs.interceptConsole();
console.log("This is captured"); // Still prints + stored in buffer
console.error("Error captured too");

// Option 2: Manual capture
logs.capture("info", "User login", { userId: "123" });

// Query logs
const errors = logs.query({ levels: ["error"], search: "timeout", limit: 50 });
const recentErrors = logs.getRecentErrors(20);

// Cleanup
logs.restoreConsole();
```

### Ring Buffer Behavior

When `maxEntries` is reached, the oldest entry is dropped to make room. This ensures predictable memory usage regardless of log volume.
