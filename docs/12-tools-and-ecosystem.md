# AI Monitor SDK: Tools & Ecosystem Guide

This guide breaks down all the "tools" involved in the AI Monitor service. It is divided into three categories: **Internal SDK Packages**, the **Observability Stack (OSS)**, and **Developer Workflow Tools**.

---

## 1. Internal SDK Packages

These are the packages built and maintained in this repository.

| Tool / Component | What It Is Used For |
| :--- | :--- |
| **`@momen124/ai-monitor-ai`** | The central AI Brain. Connects to LLMs (OpenAI, Ollama) to analyze incidents, fetch contextual traces, and compress contexts. This is our core competitive advantage. |
| **`@momen124/ai-monitor-otel`** | A hyper-thin configuration wrapper for `@opentelemetry/auto-instrumentations-node` that instantly correctly wires a Node.js app to our backend. |
| **`@momen124/ai-monitor-core`** | Structural glue: fluent configuration builders, shared TS interfaces, and webhook receiver bridges for Keep and GlitchTip. |

---

## 2. Observability Stack Tools (OSS Backbone)

These are external, battle-tested open-source tools that handle the heavy lifting of raw telemetry ingestion, storage, and alert routing. The AI service sits on top of this stack.

| Tool | Ecosystem | What It Is Used For |
| :--- | :--- | :--- |
| **OpenTelemetry (OTEL)** | Telemetry SDK | Standardized SDKs for 12+ languages (Node.js, Python, Go, Java). Extracts traces, logs, and metrics (Golden Signals) without custom code. |
| **OTEL Collector** | Routing | Receives data from all application OTel SDKs, batches/filters it, and exports it to SigNoz. |
| **SigNoz** | Storage & APM | A ClickHouse-backed observability platform. Out-of-the-box APM dashboards, service maps, and long-term storage for logs/metrics. Replaces custom Prometheus implementations. |
| **Keep** | AIOps & Alerting | An alert management platform. Receives threshold alerts from SigNoz, deduplicates them, groups them, applies maintenance windows, and triggers our AI service. |
| **GlitchTip** | Error Tracking | Optional Sentry-compatible error tracker for deep stack-trace collection directly from frontends or unhandled backend exceptions. |
| **Coroot** | Cluster Discovery | Optional eBPF agent for Kubernetes. Automatically builds service maps and traces network calls for uninstrumented legacy applications. |
| **LLMs (OpenAI/Local)** | Intelligence | The natural language engines that our `ai-monitor-ai` package prompts to generate RCA summaries. |

---

## 3. Developer Workflow Tools (For Contributors)

If you are contributing code directly to this repository, you will interact with the following:

| Tool | What It Is Used For |
| :--- | :--- |
| **pnpm** | The fast, disk-space-efficient package manager used to install dependencies. Handles internal monorepo workspace linking. |
| **tsup** | A blazingly fast TypeScript bundler powered by esbuild. Compiles `.ts` source files into CommonJS and ESM distributed files under `dist/`. |
| **Jest & ts-jest** | The testing framework. Executes unit tests (e.g., `pnpm run test:coverage`) and offline LLM evaluation harnesses. |
| **Biome** | (Replaces ESLint/Prettier). Ultra-fast toolchain used to lint and format the codebase in milliseconds. |
| **Docker Compose** | Spun up in `examples/standalone-infra` to instantly run SigNoz, Keep, and the OTel Collector for local end-to-end integration testing. |
| **CodeRabbit** | AI-powered code review agent integrated into GitHub. Batch validates Pull Requests for architecture consistency and best practices. |

---

## 4. Production Hosting & Deployment

When deploying the AI Brain service to production alongside the OSS ecosystem:

| Tool | What It Is Used For |
| :--- | :--- |
| **Kubernetes / Helm** | Most recommended way to deploy the entire stack (SigNoz chart + Keep chart + AI Brain deployment) for enterprise environments. |
| **PM2** | For bare-metal deployments of the AI Brain worker service. |
| **Cloudflare Quick Tunnels** | Secure ingress to expose the AI Webhook Receiver to external testing from remote Keep instances without configuring complex reverse proxies. |
