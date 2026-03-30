# Production Readiness Checklist

Before deploying the AI Monitor SDK to a production environment (whether Monolith, Microservice, or Serverless), ensure you review and check off the following configurations.

## Security

- [ ] **Secret Management**: Ensure `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `SLACK_WEBHOOK_URL`, etc., are loaded from a secure vault (e.g., AWS Secrets Manager, Doppler, or strictly via `.env` files not committed to Git).
- [ ] **Payload Sanitization**: Ensure your `AIConfig` (if passing custom context) excludes PII (Personally Identifiable Information), passwords, and session tokens before the payload is sent to LLM APIs.
- [ ] **Network Egress**: If your production environment uses a strict egress firewall, whitelist the domains for the AI provider (e.g., `api.openai.com`) and Notifiers (e.g., `api.telegram.org`, `hooks.slack.com`).

## Performance & Scaling

- [ ] **Deduplication Tuning**: Adjust the deduplication window based on your traffic volume to prevent alert storms. Default is typically sufficient, but high-throughput microservices may need an aggressive caching strategy.
  ```typescript
  deduplication: { enabled: true, windowMs: 300000 } // 5 minutes
  ```
- [ ] **Memory Limits**: The SDK intercepts HTTP requests and responses. While the SDK caps payload inspection at **1MB** to protect memory, high-concurrency environments with large file uploads should explicitly exclude file upload routes from instrumentation.
- [ ] **Timeouts**: The SDK enforces strict HTTP timeouts for AI and external notifier API calls (usually 5-10s) to prevent event loop blocking. Verify these timeouts align with your service's SLA.
- [ ] **Prometheus Scraping**: If using `@momen124/ai-monitor-instrumentation`, ensure the `/metrics` endpoint is protected (e.g., internal network only or via basic auth) to prevent unauthorized scraping and metric exposure.

## Architectural Deployment

- **Microservices**: Ensure `X-Trace-Id` headers are being passed downstream via your HTTP clients to utilize the distributed tracing capabilities fully.
- **Serverless**: Check that you are utilizing "fire-and-forget" alerting patterns to ensure background monitoring calls do not artificially inflate your Lambda/Function execution duration and billing.

## Rollout Strategy
1. **Dry Run**: Enable the monitor with `AI_ENABLED=false` or simply log alerts to the console first to gauge the noise level.
2. **Staging / Beta**: Wire the Notifiers to non-critical Slack/Discord channels to refine alert thresholds.
3. **Production**: Route critical severity alerts to PagerDuty or an on-call Telegram group, while routing info/warning alerts to a general observability channel.
