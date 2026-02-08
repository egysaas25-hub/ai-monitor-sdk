# API Reference — `@aker/ai-monitor-notifiers`

> Notification delivery channels for the AI Monitor SDK. Each notifier implements the `INotifier` interface and can format alerts, pipeline statuses, deployments, and daily reports for its target platform.

---

## Package Overview

```bash
pnpm add @aker/ai-monitor-notifiers
```

All notifier dependencies are **optional peer dependencies** — install only the ones you need:

| Notifier           | Peer Dependency | Install Command       |
| ------------------ | --------------- | --------------------- |
| `TelegramNotifier` | `telegram`      | `pnpm add telegram`   |
| `SlackNotifier`    | `axios`         | `pnpm add axios`      |
| `EmailNotifier`    | `nodemailer`    | `pnpm add nodemailer` |
| `MultiNotifier`    | —               | —                     |
| `WebhookNotifier`  | `axios`         | `pnpm add axios`      |
| `DiscordNotifier`  | `axios`         | `pnpm add axios`      |

If a peer dependency is not installed, the notifier disables itself gracefully and logs a warning — it will **never** crash your application.

---

## `TelegramNotifier`

Sends notifications to Telegram via the Bot API.

### Configuration

```typescript
interface ITelegramConfig {
  token: string; // Bot token from @BotFather
  chatId: string; // Target chat/group ID
  parseMode?: "Markdown" | "HTML"; // Default: 'Markdown'
  disableWebPagePreview?: boolean; // Default: true
}
```

### Usage

```typescript
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";

const telegram = new TelegramNotifier({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID!,
});
```

### Severity Emojis

| Severity   | Emoji |
| ---------- | ----- |
| `CRITICAL` | 🚨    |
| `WARNING`  | ⚠️    |
| `INFO`     | ℹ️    |

---

## `SlackNotifier`

Sends notifications to Slack via Incoming Webhooks using rich attachments.

### Configuration

```typescript
interface ISlackConfig {
  webhookUrl: string; // Slack Incoming Webhook URL
}
```

### Usage

```typescript
import { SlackNotifier } from "@aker/ai-monitor-notifiers";

const slack = new SlackNotifier({
  webhookUrl: process.env.SLACK_WEBHOOK_URL!,
});
```

---

## `EmailNotifier`

Sends notifications via SMTP using `nodemailer`.

### Configuration

```typescript
interface IEmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: { user: string; pass: string };
  from: string;
  to: string | string[];
}
```

### Usage

```typescript
import { EmailNotifier } from "@aker/ai-monitor-notifiers";

const email = new EmailNotifier({
  host: "smtp.gmail.com",
  port: 587,
  auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASS! },
  from: "monitor@example.com",
  to: ["ops-team@example.com"],
});
```

---

## `MultiNotifier`

Composite notifier that fans out to multiple channels.

### Usage

```typescript
import { MultiNotifier } from "@aker/ai-monitor-notifiers";

const multi = new MultiNotifier({
  notifiers: [telegram, slack, email],
  stopOnFirstError: false, // Default: parallel fan-out
});
```

---

## `WebhookNotifier`

Generic HTTP notifier — POST JSON payloads to any URL. Works with PagerDuty, Opsgenie, custom dashboards, or any webhook consumer.

### Configuration

```typescript
interface IWebhookConfig {
  url: string; // Target webhook URL
  method?: string; // HTTP method (default: 'POST')
  headers?: Record<string, string>; // Custom headers
  retries?: number; // Max retry attempts (default: 3)
  retryDelayMs?: number; // Base delay between retries (default: 1000ms)
}
```

### Usage

```typescript
import { WebhookNotifier } from "@aker/ai-monitor-notifiers";

const pagerduty = new WebhookNotifier({
  url: "https://events.pagerduty.com/v2/enqueue",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Token token=${process.env.PD_TOKEN}`,
  },
  retries: 3,
  retryDelayMs: 1000,
});
```

### Retry Behavior

Uses **exponential backoff**: delay = `retryDelayMs × 2^attempt`. After all retries are exhausted, the last error is thrown.

### Payload Format

All payloads are structured JSON with a `type` field:

```json
{
  "type": "alert",
  "severity": "CRITICAL",
  "title": "DB Down",
  "message": "Connection refused on port 5432",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

## `DiscordNotifier`

Sends rich embed notifications to Discord via Webhook API.

### Configuration

```typescript
interface IDiscordConfig {
  webhookUrl: string; // Discord Webhook URL
  username?: string; // Bot username override
  avatarUrl?: string; // Bot avatar URL override
}
```

### Usage

```typescript
import { DiscordNotifier } from "@aker/ai-monitor-notifiers";

const discord = new DiscordNotifier({
  webhookUrl: process.env.DISCORD_WEBHOOK_URL!,
  username: "AI Monitor",
});
```

### Embed Colors

| Severity   | Color  |
| ---------- | ------ |
| `CRITICAL` | Red    |
| `WARNING`  | Yellow |
| `INFO`     | Green  |

### Rich Embed Features

- **Alerts** — Severity color sidebar, title with emoji, structured fields, optional metrics code block
- **Pipelines** — Status emoji (✅/❌/⚠️), job name, build number, duration, changes list
- **Deployments** — Environment, version, rocket/cross emoji, change log
- **Daily Reports** — Total/critical/auto-fixed counts, uptime, top issues

---

## Creating a Custom Notifier

Implement the `INotifier` interface from `@aker/ai-monitor-core`:

```typescript
import type {
  INotifier,
  IAlert,
  IPipelineStatus,
  IDeployment,
  IDailyReport,
} from "@aker/ai-monitor-core";

class MyNotifier implements INotifier {
  async send(message: string): Promise<void> {
    /* ... */
  }
  async sendAlert(alert: IAlert): Promise<void> {
    /* ... */
  }
  async sendPipelineStatus(status: IPipelineStatus): Promise<void> {
    /* ... */
  }
  async sendDeploymentNotification(deployment: IDeployment): Promise<void> {
    /* ... */
  }
  async sendDailyReport(report: IDailyReport): Promise<void> {
    /* ... */
  }
}
```
