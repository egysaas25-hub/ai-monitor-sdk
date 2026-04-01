# AI Monitor SDK Execution Plan

## Current baseline
The current guide shows the SDK already has `AIMonitor`, `AIService`, `Deduplicator`, health probes, configuration builder, instrumentation, notifiers, and integrations around Prometheus, Grafana, OpenAI, and OpenTelemetry. This means the repo already has the right seed for an alerting/orchestration layer, but it still needs stronger separation between core observability, storage/integrations, and AI-specific enrichment.

## Product split
Treat the platform as three layers:

1. **Telemetry & Storage (Delegated to OSS)**
   - OTel Auto-instrumentation (Node, Python, Go, Java, etc.)
   - OpenTelemetry Collector (routing/batching)
   - SigNoz (metrics, logs, traces storage & dashboards)

2. **Monitoring Control Plane (Delegated to OSS)**
   - Keep (alert deduplication, grouping, routing)
   - Keep (incident lifecycle, maintenance windows)
   - Coroot (optional, eBPF K8s discovery)

3. **The AI Layer (What We Build)**
   - Provider abstraction (OpenAI, Ollama, internal LLMs)
   - Prompt/evaluation pipeline
   - Context gathering (querying SigNoz for traces/logs around an incident)
   - PII redaction and payload compression
   - Root cause summarization & remediation suggestions

Because layers 1 and 2 are handled by proven open-source tools, our build effort is laser-focused on layer 3.

## Repo structure target

```text
packages/
  ai-monitor-core/    (slim wrapper: ConfigBuilder, Keep/GlitchTip hooks)
  ai-monitor-otel/    (thin presets for OTel Auto-instrumentation)
  ai-monitor-ai/      (THE MOAT: LLM orchestration, evaluation, prompts)
examples/
  standalone-infra/   (docker-compose for SigNoz + Keep + OTel Collector)
  node-basic/         (Node.js app with OTel wrapper)
docs/
  architecture/
  runbooks/
```

## Branch strategy

### Permanent branches
- `main` — protected, releasable only
- `develop` — optional integration branch if the team prefers one
- `release/*` — release hardening only

### Delivery branches
- `feat/v2-architecture-pivot` (docs & repo restructure)
- `feat/otel-presets`
- `feat/ai-provider-abstraction`
- `feat/ai-orchestration`
- `feat/infra-compose-profiles`

### AI teammate branch
Use one long-running branch only if they are doing deep experiments:
- `feat/ai-lab`

Better option:
- `feat/ai-provider-abstraction`
- `feat/ai-evaluation-harness`
- `feat/ai-enrichment-engine`
- `feat/ai-remediation-engine`

If the teammate needs freedom, let them work under `packages/ai-monitor-ai` and `examples/ai-enrichment-demo`, but freeze the interface contract in `ai-monitor-core` first.

## Contract the AI teammate must build against

### Core interfaces

```ts
export interface AIIncidentContext {
  incidentId: string;
  title: string;
  summary?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  environment: string;
  labels: Record<string, string>;
  metrics?: Array<{ name: string; value: number; unit?: string }>;
  logs?: Array<{ timestamp: string; level: string; message: string }>;
  traces?: Array<{ traceId: string; spanId?: string; name?: string; durationMs?: number }>;
  deployments?: Array<{ version: string; time: string; actor?: string }>;
  runbooks?: Array<{ title: string; url: string }>;
}

export interface AIEnrichmentResult {
  summary: string;
  probableCauses: Array<{ cause: string; confidence: number }>;
  recommendedActions: Array<{ action: string; priority: 'p1' | 'p2' | 'p3' }>;
  risk: 'low' | 'medium' | 'high';
  needsHumanReview: boolean;
  model?: string;
  provider?: string;
  latencyMs?: number;
}

export interface AIProvider {
  name: string;
  enrich(context: AIIncidentContext): Promise<AIEnrichmentResult>;
  healthCheck?(): Promise<boolean>;
}
```

### Rules
- The AI package cannot import Prometheus/Grafana-specific classes directly.
- It only consumes normalized context from `ai-monitor-core`.
- It must support pluggable providers: OpenAI, internal LLM, Ollama, vLLM, mock provider.
- It must enforce timeout, token budget, and payload size limits.
- It must support redaction before sending data to any external model.
- It must return partial results gracefully if some context is missing.

## Team ownership split

### Platform team
Owns:
- `ai-monitor-core` (Keep/GlitchTip hooks, config)
- `ai-monitor-otel` (thin OTel config presets)
- Docker Compose local environment (SigNoz, Keep, Collector)

### AI teammate / AI squad
Owns:
- `ai-monitor-ai`
- prompt templates
- provider adapters
- evaluation harness
- feedback dataset format
- remediation ranking logic
- redaction policies for LLM calls
- AI demo example

### Shared ownership
- docs/architecture/ai-boundaries.md
- docs/runbooks/ai-fallback.md
- end-to-end contract tests

## Epic backlog

## Epic 0 — Architecture freeze
Goal: lock the package boundaries and contracts before parallel work starts.

Stories:
- Write ADR for package split — 3 points
- Define normalized incident/event schema — 5 points
- Define AI provider interfaces — 3 points
- Define config schema and validation strategy — 5 points
- Add repo conventions, CODEOWNERS, branch protection, labels — 3 points

Exit criteria:
- AI teammate can work without waiting on core refactors
- Core package exposes stable interface contracts

## Epic 1 — OTEL Foundation (Thin Wrapper)
Goal: Delegate ingestion to OTel seamlessly.

Stories:
- Create `ai-monitor-otel` package — 3 points
- Export preset configs for `@opentelemetry/auto-instrumentations-node` — 5 points
- Build `docker-compose.yml` with SigNoz + Keep + Collector — 8 points
- Add example service exporting telemetry — 3 points

Exit criteria:
- Node.js app runs with our wrapper and data appears in SigNoz

## Epic 2 & 3 & 4 & 5 — (DELEGATED TO OSS)
*Previously covered Alerting, Incident Control, SLOs, and Probes. These are now 100% delegated to SigNoz and Keep. No custom SDK logic required.*

## Epic 6 — AI enrichment engine
Goal: give the AI teammate a clear vertical slice they can own end to end.

Stories:
- Create `ai-monitor-ai` package — 3 points
- Implement provider abstraction — 5 points
- Add OpenAI provider adapter — 5 points
- Add local/internal model adapter — 5 points
- Add prompt template system — 5 points
- Implement SigNoz trace/log context fetcher — 8 points
- Add context compression/summarization pipeline — 8 points
- Add redaction and safety filter — 8 points
- Add timeout/retry/circuit-breaker behavior — 5 points
- Add enrichment result schema validation — 3 points
- Add fallback to rule-based summarizer — 5 points

Exit criteria:
- AI can enrich incidents without blocking incident delivery
- Model backend can be swapped without touching core logic

## Epic 7 — AI evaluation and feedback loop
Goal: prevent the AI layer from becoming random and unverifiable.

Stories:
- Build offline evaluation harness — 8 points
- Define gold dataset format from past incidents — 5 points
- Add scoring for summary quality/actionability/hallucination risk — 8 points
- Add human feedback capture format — 5 points
- Add regression suite for prompts/providers — 8 points
- Add model latency and cost dashboard — 3 points

Exit criteria:
- Every provider/prompt change can be benchmarked before merge

## Epic 8 — Hardening and enterprise readiness
Goal: make the SDK production-safe.

Stories:
- Add PII redaction rules — 8 points
- Add backpressure/offline buffering — 8 points
- Add multi-tenant labels/tenant isolation — 5 points
- Add secret-provider abstraction — 5 points
- Add audit logs for AI actions — 5 points
- Add rate limits and quotas — 5 points

Exit criteria:
- SDK can be deployed in stricter environments safely

## Suggested sprint plan
Assume 2-week sprints.

### Sprint 1
- Epic 0 complete
- Establish `docker-compose` infra (SigNoz/Keep)
- Start Epic 1 (OTel wrap)

### Sprint 2
- Finish Epic 1
- Start Epic 6 (AI Engine)
- AI teammate builds provider adapters

### Sprint 3
- AI teammate builds prompt/context fetcher (from SigNoz)

### Sprint 4
- Finish Epic 6
- AI teammate starts evaluation harness (Epic 7)

### Sprint 5
- Finish Epic 7
- Hardening & Release Prep (Epic 8)

## What the AI teammate should be allowed to change freely
Inside `packages/ai-monitor-ai`, let them experiment with:
- provider implementations
- prompt templates
- prompt assembly/compression
- response parsing
- scoring/ranking logic
- offline evaluation
- feature flags for AI behavior
- local model integration

Do not let them freely change without review:
- `AIIncidentContext`
- `AIEnrichmentResult`
- notifier contracts
- incident lifecycle schema
- telemetry schema
- redaction policy defaults

## Definition of done for the AI branch
- AI package compiles independently
- works with mock provider, OpenAI provider, and internal/local provider
- all outbound payloads pass redaction
- timeout cannot block alert delivery
- enrichment result is validated and typed
- offline evaluation can run in CI
- example app demonstrates one end-to-end enriched incident
- docs explain how to add a new provider

## Recommended first tickets for the AI teammate
1. Create `packages/ai-monitor-ai` skeleton
2. Add `AIProvider` interface and package exports
3. Add mock provider and contract tests
4. Add OpenAI provider adapter
5. Add local/internal LLM adapter
6. Add prompt builder and context truncation utility
7. Add schema validation for AI responses
8. Add redaction middleware
9. Add fallback summarizer
10. Add evaluation CLI and sample dataset

## Copy-paste brief for the AI teammate

> You own `packages/ai-monitor-ai`.
> Your job is to build an optional AI enrichment engine that consumes normalized incident context and returns structured root-cause hints and recommended actions.
> You are free to experiment with providers, prompts, ranking, and evaluation, but you must not break the public contracts in `ai-monitor-core`.
> The AI layer must fail-open, be provider-agnostic, support external and internal LLMs, and include redaction, timeout, schema validation, and offline evaluation.

## Delivery risk to watch
- If package boundaries are not frozen first, AI work will drift and get blocked.
- If the AI layer owns too much incident logic, the whole system becomes harder to test.
- If you skip offline evaluation, prompt changes will feel good but be unreliable.
- If AI is on the hot path, incident delivery becomes fragile.
- If you do not redact before model calls, enterprise adoption will be hard.
