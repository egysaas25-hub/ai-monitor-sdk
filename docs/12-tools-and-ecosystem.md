# AI Monitor SDK: Tools & Ecosystem Guide

This guide breaks down all the "tools" involved in the AI Monitor SDK. It is divided into three categories: **Internal SDK Components**, the **Observability Stack**, and **Developer Workflow Tools**.

---

## 1. Internal SDK Tools & Components

These are the tools built into the SDK itself that you use to write your monitoring logic.

| Tool / Component | Package | What It Is Used For |
| :--- | :--- | :--- |
| **AIMonitor** | `@momen124/ai-monitor-core` | The central brain. It receives raw alerts, passes them to the AI, runs them through deduplication, and forwards them to notifiers. |
| **AIService** | `@momen124/ai-monitor-core` | Talks to LLMs (like OpenAI) to provide root-cause analysis, anomaly detection, and auto-healing suggestions before the alert is sent out. |
| **Deduplicator** | `@momen124/ai-monitor-core` | Prevents "alert fatigue" by hashing alerts and suppressing identical, repetitive errors that occur within a specific time window. |
| **Health Probes** | `@momen124/ai-monitor-core` | Active pingers. Use these to routinely check external dependencies (like your PostgreSQL database) on an interval and alert if they go down. |
| **ConfigBuilder** | `@momen124/ai-monitor-core` | A fluent builder pattern utility used to easily bootstrap and configure the AIMonitor without massive configuration objects. |
| **Instrumentation Orchestrator** | `@momen124/ai-monitor-instrumentation` | Automatically attaches to Node.js/Express to extract Golden Signals (Latency, Traffic, Errors, Saturation) with zero manual code. |
| **Notifiers** | `@momen124/ai-monitor-notifiers` | Pluggable classes (`TelegramNotifier`, `SlackNotifier`, `WebhookNotifier`) used to route the final analyzed alerts to human chat applications. |

---

## 2. Observability Stack Tools

These are external third-party tools that the AI Monitor SDK integrates with to provide a full production setup.

| Tool | Ecosystem | What It Is Used For |
| :--- | :--- | :--- |
| **Prometheus** | Metric Storage | A time-series database. The SDK's `instrumentation` package exposes a `/metrics` endpoint that Prometheus routinely scrapes to store historical data (e.g., memory over the last 30 days). |
| **Grafana** | Visualization | A dashboard UI that queries Prometheus. Used by humans to see graphs, charts, and heatmaps of the application's performance. |
| **OpenAI API** | Intelligence | The LLM provider (can be swapped). It reads stack traces and logs provided by the `AIService` and returns human-readable context. |
| **Telegram / Slack Bots** | Paging | Acts as the real-time pager. These tools deliver the final alerts directly to developers' phones so they can act on critical crashes immediately. |
| **OpenTelemetry (OTEL)** | Distributed Tracing | Standardized format for transmitting trace and span boundaries. The SDK is built to be OTEL-compliant when injecting `X-Trace-Id` headers across microservice requests. |

---

## 3. Developer Workflow Tools (For Contributors)

If you are contributing code directly to the AI Monitor SDK repository, you will interact with the following development tools:

| Tool | What It Is Used For |
| :--- | :--- |
| **pnpm** | The fast, disk-space-efficient package manager used to install dependencies. It is also the underlying engine for managing the monorepo "workspaces" (handling cross-package linking effortlessly). |
| **tsup** | A blazingly fast TypeScript bundler powered by esbuild. We use `tsup` to compile our `.ts` source files into CommonJS and ESM distributed files under `dist/`. |
| **Jest & ts-jest** | The testing framework. Used to write and execute unit tests (e.g., `pnpm run test:coverage`) for every component in the SDK to ensure bugs aren't introduced. |
| **Biome** | (Replaced ESLint/Prettier in some areas). Biome is an ultra-fast toolchain used to lint `pnpm run lint` and format `pnpm run format` the codebase in milliseconds. |
| **Docker Compose** | Container orchestration used strictly in `examples/` and for local end-to-end testing to instantly spin up Prometheus, Grafana, and the Node app simultaneously in isolated containers. |
| **GitHub Actions** | The CI/CD runner. Executes `ci.yml` and `publish.yml` on every PR to ensure tests pass, and automatically publishes new versions of the SDK to npm when tags are pushed. |
| **CodeRabbit** | AI-powered code review agent integrated into GitHub. Batch validates Pull Requests against robustness rules (e.g., verifying 1MB payload limits and strict Axios timeouts). |

---

## 4. Production Hosting & Deployment Tools

When you attach the AI Monitor SDK to your application, you will typically run your application using one of the following production runtime managers:

| Tool | What It Is Used For |
| :--- | :--- |
| **PM2** | Advanced Node.js process manager. Monitors the host application process; if the app crashes, PM2 restarts it automatically. The SDK logs these restarts for post-mortem observability. |
| **Kubernetes (K8s)** | Enterprise orchestration. The SDK gracefully handles pod eviction notices by batch-flushing final telemetry events synchronously before the Kubernetes control plane kills the container. |
| **Cloudflare Quick Tunnels** | Secure ingress. Often used in sandbox or Telegram Mini App bounds to instantly expose the local AI Monitor `/health` check or Webhooks securely over HTTPS without configuring complex reverse proxies. |
