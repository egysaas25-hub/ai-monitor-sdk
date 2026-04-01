# Robustness & Architecture Guide

The AI Monitor service is engineered to be a non-intrusive, zero-impact observability layer. It operates under the strictest assumption: **Monitoring must never crash or degrade the performance of the host application.**

## Supported Architectures (Zero-Impact via OTel)

By delegating telemetry to OpenTelemetry (OTel), we ensure robust monitoring for any architecture:

### 1. Microservices & Distributed Systems
- **Trace Context Propagation**: OpenTelemetry automatically attaches and forwards `traceparent` across service boundaries natively.
- **Log Aggregation**: Each service sends its isolated logs to SigNoz. When an alert triggers, the AI Brain fetches the exact distributed trace to reconstruct the full context.

### 2. Serverless (AWS Lambda, Google Cloud Functions)
- **Batched Flushing**: The OTel generic serverless wrappers handle batching and synchronous flushing before the execution context freezes, ensuring no data loss.

### 3. Monoliths
- **Holistic Resource Probing**: The OTel Collector's Host Metrics Receiver tracks CPU and Memory without weighing down the Node process itself.

---

## Production Robustness Safeguards

When running the AI Brain service in production, the system protects itself and the host applications through several defensive mechanisms:

### 1. Zero In-Process Overhead
Because the AI Brain is deployed as a standalone service (or worker), the heavy lifting of LLM context compilation, token calculation, and prompt execution happens **outside** of your application's memory pool. If the AI Brain exhausts its memory, your application is unaffected.

### 2. Payload Size Limits & PII Redaction
To prevent Denial of Service (DoS), out-of-memory errors, and data privacy breaches before sending data to LLMs:
- The AI Brain forcefully truncates any trace context exceeding **1MB** before parsing.
- A dedicated **RedactionPipeline** strips PII, credit cards, and tokens via Regex/AST sweeps before the payload ever reaches OpenAI.

### 3. Circuit Breaking & Fail-Open AI
When the LLM Provider (e.g., OpenAI) is slow or degraded:
- **Strict Timeouts**: If the LLM takes longer than 15 seconds to reply, the AI Brain aborts the enrichment.
- **Fail-Open Routing**: Instead of dropping the alert, the AI Brain immediately forwards the *raw, unenriched* alert back to Keep for human delivery. The humans still get paged, even if the AI is down.

### 4. Alert Deduplication (via Keep)
To prevent "alert storms" (e.g., a database goes down and triggers 10k errors):
- We delegate the heavy lifting of stateful deduplication to **Keep**. Keep hashes the alerts and suppresses identical occurrences within a given time window *before* waking up the AI Brain, saving massive LLM API costs.

---
_By adhering to these architectural patterns, you can confidently deploy the AI Monitor ecosystem in production environments at any scale._
