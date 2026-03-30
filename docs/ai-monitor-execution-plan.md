# AI Monitor SDK Execution Plan

## Current baseline
The current guide shows the SDK already has `AIMonitor`, `AIService`, `Deduplicator`, health probes, configuration builder, instrumentation, notifiers, and integrations around Prometheus, Grafana, OpenAI, and OpenTelemetry. This means the repo already has the right seed for an alerting/orchestration layer, but it still needs stronger separation between core observability, storage/integrations, and AI-specific enrichment.

## Product split
Treat the platform as three layers:

1. **Telemetry + integrations layer**
   - OTEL/Collector integration
   - metrics/logs/traces/profile adapters
   - backend connectors

2. **Monitoring control plane**
   - normalized event model
   - correlation engine
   - alert routing
   - incident lifecycle
   - SLOs, probes, synthetics

3. **AI layer**
   - provider abstraction
   - prompt/evaluation pipeline
   - root cause summarization
   - anomaly classification
   - remediation suggestions
   - model safety and redaction

The AI layer must be optional and fail-open. Alert delivery must still work if the model fails, times out, or is disabled.

## Repo structure target

```text
packages/
  ai-monitor-core/
  ai-monitor-otel/
  ai-monitor-logs/
  ai-monitor-tracing/
  ai-monitor-alerting/
  ai-monitor-incident/
  ai-monitor-slo/
  ai-monitor-probes/
  ai-monitor-synthetics/
  ai-monitor-k8s/
  ai-monitor-browser/
  ai-monitor-workers/
  ai-monitor-serverless/
  ai-monitor-exporters/
  ai-monitor-ai/
  ai-monitor-cli/
examples/
  node-basic/
  express-lgtm/
  k8s-demo/
  ai-enrichment-demo/
docs/
  architecture/
  runbooks/
  adr/
```

## Branch strategy

### Permanent branches
- `main` — protected, releasable only
- `develop` — optional integration branch if the team prefers one
- `release/*` — release hardening only

### Delivery branches
- `feat/foundation-core-split`
- `feat/otel-foundation`
- `feat/logs-traces-correlation`
- `feat/alerting-incident-control-plane`
- `feat/slo-synthetics`
- `feat/k8s-infra-pack`
- `feat/browser-workers-runtime`
- `feat/exporters-enterprise`

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
- `ai-monitor-core`
- `ai-monitor-otel`
- `ai-monitor-logs`
- `ai-monitor-tracing`
- `ai-monitor-alerting`
- `ai-monitor-incident`
- `ai-monitor-slo`
- `ai-monitor-probes`
- `ai-monitor-synthetics`
- `ai-monitor-exporters`
- overall schemas and interfaces

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

## Epic 1 — OTEL and telemetry foundation
Goal: make observability ingestion standard and backend-agnostic.

Stories:
- Create `ai-monitor-otel` package — 5 points
- Add resource attributes and environment metadata — 3 points
- Add trace context propagation helpers — 5 points
- Build OTLP exporter wrapper and collector presets — 5 points
- Add example service exporting metrics/logs/traces — 5 points

Exit criteria:
- One demo service emits normalized telemetry through OTEL

## Epic 2 — Logs, traces, and correlation
Goal: make incidents clickable across logs, traces, and metrics.

Stories:
- Add structured log adapters — 5 points
- Add trace-to-log correlation helpers — 5 points
- Add deep link builders for dashboards/logs/traces — 3 points
- Add exemplars/correlation metadata — 5 points
- Add correlation tests across signals — 5 points

Exit criteria:
- An alert can open related logs and traces from one incident object

## Epic 3 — Alerting and incident control plane
Goal: move from simple deduplication to full incident handling.

Stories:
- Expand dedup into grouping/inhibition/silencing model — 8 points
- Add incident state machine (open, acked, resolved) — 5 points
- Add maintenance windows — 3 points
- Add notifier policy engine — 5 points
- Add alert routing adapters and escalation hooks — 5 points

Exit criteria:
- Repeated alerts collapse into one incident lifecycle

## Epic 4 — SLOs, probes, and synthetics
Goal: alert on user impact, not just raw thresholds.

Stories:
- Build SLO spec models — 5 points
- Add burn-rate alert templates — 5 points
- Expand probes to DB/HTTP/TCP/TLS/queue — 5 points
- Add scheduled synthetic workflow runner — 8 points
- Add SLO dashboard example — 3 points

Exit criteria:
- At least one service can define SLOs and active checks

## Epic 5 — Runtime and infrastructure adapters
Goal: make the SDK useful in real deployments.

Stories:
- Add K8s metadata enricher — 5 points
- Add deployment event correlation — 5 points
- Add worker/queue instrumentation — 5 points
- Add serverless lifecycle hooks — 5 points
- Add infra example deployment — 5 points

Exit criteria:
- Rollouts, pod restarts, and job failures can be tied to incidents

## Epic 6 — AI enrichment engine
Goal: give the AI teammate a clear vertical slice they can own end to end.

Stories:
- Create `ai-monitor-ai` package — 3 points
- Implement provider abstraction — 5 points
- Add OpenAI provider adapter — 5 points
- Add local/internal model adapter — 5 points
- Add prompt template system — 5 points
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
- Start Epic 1
- AI teammate starts `feat/ai-provider-abstraction`

### Sprint 2
- Finish Epic 1
- Start Epic 2
- AI teammate builds OpenAI + local provider adapters

### Sprint 3
- Finish Epic 2
- Start Epic 3
- AI teammate builds prompt system + context compressor

### Sprint 4
- Finish Epic 3
- Start Epic 4
- AI teammate builds redaction, timeout, and fallback logic

### Sprint 5
- Finish Epic 4
- Start Epic 5
- AI teammate starts evaluation harness and dataset format

### Sprint 6
- Finish Epic 5
- Finish Epic 6
- AI teammate finishes regression tests and model dashboards

### Sprint 7
- Epic 7
- hardening gaps from earlier sprints

### Sprint 8
- Epic 8
- release prep for v1 beta

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
