# Robustness & Architecture Guide

The AI Monitor SDK is engineered to be a non-intrusive, zero-impact observability layer. It operates under the strictest assumption: **Monitoring must never crash or degrade the performance of the host application.**

## Supported Architectures

### 1. Microservices & Distributed Systems
In a microservices environment, a single user request often touches dozens of services. 
- **Trace Context Propagation**: The SDK's `Instrumentation` package automatically attaches and forwards `X-Trace-Id` across service boundaries.
- **Log Aggregation**: Each service sends its isolated logs to the central AI service via the `AIMonitor`, which reconstructs the full context of a distributed failure.

### 2. Monorepos
For teams using Turborepo, Nx, or pnpm workspaces (like this SDK itself):
- You can install the core SDK once at the root, or share a pre-configured internal `@my-org/monitor` package across all your internal applications.
- Unified configuration allows consistent alert routing (e.g., all apps in the monorepo alert the same Slack channel).

### 3. Serverless (AWS Lambda, Google Cloud Functions)
Serverless environments pose unique challenges for observability due to their ephemeral nature and "frozen" background execution.
- **Fire-and-Forget Mode**: The SDK can be configured to use non-blocking background promises that resolve before the Lambda execution context freezes.
- **Batched Flushing**: Instead of holding continuous WebSocket or long-polling connections, metrics are batched and flushed synchronously upon function completion.

### 4. Event-Driven Architectures (Kafka, RabbitMQ, SQS)
When processing asynchronous events:
- **Consumer Hooks**: The SDK provides manual wrap functions (`monitor.trackOperation`) which can wrap message handlers to record processing duration, retry loops, and unhandled consumer exceptions.
- **Dead-Letter Queue Alerts**: You can wire the `AIMonitor` directly to DLQ events to instantly notify engineers when an event fails all retries.

### 5. Monoliths
For traditional single-server architecture (e.g., a large Express/NestJS monolith):
- **Holistic Resource Probing**: Built-in CPU and Memory probes keep an eye on the entire node process.
- **Express Middleware**: A single `app.use(instrumentation.httpMiddleware())` at the top level is all that's required to instrument the entire app.

---

## Production Robustness Safeguards

When running in production, the AI Monitor SDK protects the host application through several defensive mechanisms (implemented based on extensive audits from previous production deployments):

### 1. Payload Size Limits & Circular Reference Protection
To prevent Denial of Service (DoS) and out-of-memory errors from massive request payloads:
- The HTTP interceptor forcefully truncates any request or response body exceeding **1MB**.
- The JSON serializer includes a safe `replacer` to drop circular references preventing `TypeError: Converting circular structure to JSON` crashes during alert generation.

### 2. Axios Timeouts & Circuit Breaking
When the AI Service (e.g., OpenAI) or Notifier APIs (Telegram/Slack) are slow or degraded:
- Strict **timeout limits** protect against hanging I/O. If a notifier takes longer than 5 seconds, the SDK drops the notification and moves on.
- **Circuit Breakers**: Repeated failures trip a circuit breaker, preventing the SDK from hammering an already-down third-party API.

### 3. Alert Deduplication
To prevent "alert storms" (e.g., a database goes down and triggers 10,000 exceptions a minute):
- The `Deduplicator` caches the hash of previous alerts. If the identical fingerprint occurs repeatedly within a configurable time window (e.g., 5 minutes), it is suppressed, saving API costs and avoiding channel spam.

### 4. Fire-and-Forget Error Handling
A failure inside the SDK will never bubble up to crash your main server. All internal `AIMonitor` errors are trapped and routed to an internal fallback logger. 

---
_By adhering to these architectural patterns, you can confidently deploy the AI Monitor SDK in production environments at any scale._
