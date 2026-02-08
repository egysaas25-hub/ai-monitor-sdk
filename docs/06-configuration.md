# Configuration Guide

> Complete reference for all environment variables and configuration options.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Core Monitor

| Variable                             | Default   | Description                         |
| ------------------------------------ | --------- | ----------------------------------- |
| `AI_MONITOR_HOST`                    | `0.0.0.0` | Server bind address                 |
| `AI_MONITOR_PORT`                    | `3333`    | Server port                         |
| `AI_MONITOR_ENABLED`                 | `true`    | Master enable/disable switch        |
| `AI_MONITOR_SEND_TEST_NOTIFICATION`  | `false`   | Send test notification on startup   |
| `AI_MONITOR_TEST_NOTIFICATION_DELAY` | `3000`    | Delay (ms) before test notification |

### AI Analysis

| Variable     | Default                     | Description                                     |
| ------------ | --------------------------- | ----------------------------------------------- |
| `AI_API_KEY` | —                           | LLM provider API key (required for AI features) |
| `AI_API_URL` | `https://api.openai.com/v1` | API endpoint (any OpenAI-compatible API works)  |
| `AI_MODEL`   | `gpt-4o-mini`               | Model to use for analysis                       |

### Telegram Notifier

| Variable             | Default | Description                                         |
| -------------------- | ------- | --------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | —       | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID`   | —       | Target chat/group ID                                |

### Slack Notifier

| Variable            | Default | Description                                                      |
| ------------------- | ------- | ---------------------------------------------------------------- |
| `SLACK_WEBHOOK_URL` | —       | [Incoming Webhook](https://api.slack.com/messaging/webhooks) URL |

### Email Notifier

| Variable     | Default          | Description                  |
| ------------ | ---------------- | ---------------------------- |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server host             |
| `EMAIL_PORT` | `587`            | SMTP port                    |
| `EMAIL_USER` | —                | SMTP username                |
| `EMAIL_PASS` | —                | SMTP password / app password |
| `EMAIL_FROM` | —                | Sender email address         |
| `EMAIL_TO`   | —                | Recipient email address(es)  |

### Webhook Notifier

| Variable      | Default | Description                  |
| ------------- | ------- | ---------------------------- |
| `WEBHOOK_URL` | —       | Target URL for POST requests |

### Discord Notifier

| Variable              | Default | Description         |
| --------------------- | ------- | ------------------- |
| `DISCORD_WEBHOOK_URL` | —       | Discord Webhook URL |

### Grafana (Docker Compose)

| Variable                 | Default | Description            |
| ------------------------ | ------- | ---------------------- |
| `GRAFANA_ADMIN_USER`     | `admin` | Grafana admin username |
| `GRAFANA_ADMIN_PASSWORD` | `admin` | Grafana admin password |

### Logging

| Variable    | Default                    | Description                                          |
| ----------- | -------------------------- | ---------------------------------------------------- |
| `LOG_LEVEL` | `info`                     | Winston log level (`error`, `warn`, `info`, `debug`) |
| `LOG_FILE`  | `/app/logs/ai-monitor.log` | Log file path                                        |

---

## Programmatic Configuration

### Direct Object

```typescript
const monitor = new AIMonitor({
  host: "0.0.0.0",
  port: 3333,
  enabled: true,
  notifiers: [telegramNotifier, slackNotifier, discordNotifier],
  logger: new WinstonLoggerAdapter(logger),
  aiConfig: {
    enabled: true,
    apiKey: "sk-...",
    model: "gpt-4o-mini",
  },
  // New Features
  deduplication: {
    enabled: true,
    cooldownMs: 300_000, // 5 minutes
  },
  probes: [
    { name: "db", type: "tcp", host: "localhost", port: 5432 },
    { name: "api", type: "http", url: "https://api.example.com" },
  ],
  enableHealthEndpoint: true,
  enableAlertEndpoint: true,
  enablePipelineEndpoint: true,
  sendTestNotification: false,
});
```

### ConfigBuilder with Env Loading

```typescript
const config = createConfig({ fromEnv: true, envPrefix: "AI_MONITOR_" })
  .addNotifier(telegramNotifier)
  .deduplication(true, 300_000)
  .build();
```

The builder reads all `AI_MONITOR_*` variables automatically and lets you override programmatically.

---

## Instrumentation Thresholds

All thresholds can be configured per-signal:

```typescript
const instrumentation = new Instrumentation({
  monitor,
  appName: "my-api",
  environment: "production",
  performanceThreshold: 500, // ms — slow operation cutoff
  systemMetricsInterval: 60000, // ms — how often to poll CPU/memory
  thresholds: {
    responseTime: { warning: 200, critical: 500 },
    errorRate: { warning: 0.1, critical: 1.0 },
    cpu: { warning: 0.5, critical: 0.7 },
    memory: { warning: 0.6, critical: 0.8 },
    dbConnections: { warning: 0.5, critical: 0.8 },
    queueLength: { warning: 100, critical: 1000 },
  },
  errorFilter: (error) => {
    // Return false to ignore certain errors
    if (error.message.includes("ECONNRESET")) return false;
    return true;
  },
});
```

---

## Feature Toggles

Individual subsystems can be disabled:

```typescript
const instrumentation = new Instrumentation({
  monitor,
  captureErrors: true, // uncaughtException / unhandledRejection
  capturePerformance: true, // operation timing
  captureHttp: true, // HTTP request/response tracking
  captureDatabase: true, // DB connection monitoring
  captureSystemMetrics: true, // CPU/memory polling
  enablePrometheus: true, // /metrics endpoint
});
```
