# @aker/ai-monitor-notifiers

> **Notification providers for AI Monitor**  
> Telegram, Slack, Email, and Multi-channel support

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 📱 **Telegram** - Send alerts via Telegram bot
- 💬 **Slack** - Beautiful formatted messages via webhook
- 📧 **Email** - HTML and text emails via SMTP
- 🔀 **Multi-Channel** - Send to multiple channels simultaneously
- 🔌 **Plug-and-Play** - Works seamlessly with `@aker/ai-monitor-core`
- 🌳 **Tree-Shakeable** - Only bundle what you use

---

## 📦 Installation

```bash
# Install core package
npm install @aker/ai-monitor-core

# Install notifiers package
npm install @aker/ai-monitor-notifiers

# Install peer dependencies for the notifiers you want to use
npm install telegram     # For Telegram
npm install axios        # For Slack
npm install nodemailer   # For Email
```

---

## 🚀 Quick Start

### Telegram Notifier

```typescript
import { AIMonitor } from "@aker/ai-monitor-core";
import { TelegramNotifier } from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  notifiers: [
    new TelegramNotifier({
      token: "YOUR_BOT_TOKEN",
      chatId: "YOUR_CHAT_ID",
    }),
  ],
});

await monitor.start();
```

### Slack Notifier

```typescript
import { SlackNotifier } from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  notifiers: [
    new SlackNotifier({
      webhookUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    }),
  ],
});
```

### Email Notifier

```typescript
import { EmailNotifier } from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  notifiers: [
    new EmailNotifier({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "your-email@gmail.com",
        pass: "your-app-password",
      },
      from: "AI Monitor <monitor@example.com>",
      to: ["team@example.com", "ops@example.com"],
    }),
  ],
});
```

### Multi-Channel Notifier

Send to all channels at once:

```typescript
import {
  MultiNotifier,
  TelegramNotifier,
  SlackNotifier,
} from "@aker/ai-monitor-notifiers";

const monitor = new AIMonitor({
  notifiers: [
    new MultiNotifier({
      notifiers: [
        new TelegramNotifier({
          /* ... */
        }),
        new SlackNotifier({
          /* ... */
        }),
        new EmailNotifier({
          /* ... */
        }),
      ],
    }),
  ],
});

// Alert will be sent to all three channels
await monitor.alert({
  severity: "CRITICAL",
  title: "System Down",
  message: "Production server is not responding",
});
```

---

## 📚 API Reference

### TelegramNotifier

```typescript
new TelegramNotifier(config: ITelegramConfig)

interface ITelegramConfig {
  token: string;                        // Bot token from @BotFather
  chatId: string;                       // Chat ID to send messages to
  parseMode?: 'Markdown' | 'HTML';     // Message format (default: 'Markdown')
  disableWebPagePreview?: boolean;     // Disable link previews (default: true)
}
```

**Getting Telegram credentials:**

1. Create bot via [@BotFather](https://t.me/BotFather)
2. Get chat ID by messaging [@userinfobot](https://t.me/userinfobot)

### SlackNotifier

```typescript
new SlackNotifier(config: ISlackConfig)

interface ISlackConfig {
  webhookUrl: string;  // Slack webhook URL
}
```

**Getting Slack webhook:**

1. Go to https://api.slack.com/apps
2. Create an app → Incoming Webhooks → Add to Workspace
3. Copy webhook URL

### EmailNotifier

```typescript
new EmailNotifier(config: IEmailConfig)

interface IEmailConfig {
  host: string;           // SMTP server host
  port: number;           // SMTP server port
  secure?: boolean;       // Use TLS (default: false)
  auth: {
    user: string;         // SMTP username
    pass: string;         // SMTP password
  };
  from: string;           // From address
  to: string | string[];  // Recipient(s)
}
```

### MultiNotifier

```typescript
new MultiNotifier(config: IMultiNotifierConfig)

interface IMultiNotifierConfig {
  notifiers: INotifier[];       // Array of notifiers
  stopOnFirstError?: boolean;   // Stop on first failure (default: false)
}
```

---

## 🎨 Message Formatting

### Alert Messages

All notifiers format alerts with:

- Severity emoji (🚨 Critical, ⚠️ Warning, ℹ️ Info)
- Title and message
- Timestamp
- Optional metrics

### Pipeline Status

- Status emoji (✅ Success, ❌ Failure, ⚠️ Unstable, ⏹️ Aborted)
- Job name and build number
- Duration
- Changes list (if provided)
- Build URL (if provided)

### Deployment Notifications

- Environment and version
- Status
- Duration
- Changes
- Environment URL

### Daily Reports

- Overall health status
- Summary metrics (alerts, auto-fixes, uptime)
- Top issues list

---

## 🎯 Examples

### Conditional Notifiers

```typescript
const notifiers = [];

// Always use Telegram
notifiers.push(
  new TelegramNotifier({
    /* ... */
  }),
);

// Use Slack only in production
if (process.env.NODE_ENV === "production") {
  notifiers.push(
    new SlackNotifier({
      /* ... */
    }),
  );
}

// Use Email for critical alerts
notifiers.push(
  new EmailNotifier({
    /* ... */
  }),
);

const monitor = new AIMonitor({ notifiers });
```

### Error Handling

```typescript
const monitor = new AIMonitor({
  notifiers: [
    new MultiNotifier({
      notifiers: [telegram, slack, email],
      stopOnFirstError: false, // Continue even if one fails
    }),
  ],
});

// If Slack fails, Telegram and Email still receive notifications
```

### Custom Notifier

Create your own notifier:

```typescript
import type { INotifier, IAlert } from "@aker/ai-monitor-core";

class DiscordNotifier implements INotifier {
  constructor(private webhookUrl: string) {}

  async send(message: string): Promise<void> {
    await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  }

  async sendAlert(alert: IAlert): Promise<void> {
    const message = `**${alert.severity}**: ${alert.title}\n${alert.message}`;
    await this.send(message);
  }

  // Implement other methods...
}

// Use it!
const monitor = new AIMonitor({
  notifiers: [new DiscordNotifier("YOUR_WEBHOOK")],
});
```

---

## 🔧 Troubleshooting

### Telegram not sending messages

1. Verify bot token is correct
2. Ensure chat ID is correct (message the bot first)
3. Check internet connectivity
4. Install `telegram` package: `npm install telegram`

### Slack webhook failing

1. Verify webhook URL is correct and active
2. Check Slack app permissions
3. Install `axios` package: `npm install axios`

### Email not sending

1. Verify SMTP credentials
2. Check firewall/port access (usually 587 or 465)
3. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
4. Install `nodemailer` package: `npm install nodemailer`

---

## 📖 Related Packages

- **[@aker/ai-monitor-core](../ai-monitor-core)** - Core monitoring functionality

---

## 📝 License

MIT © AKER Team

---

**Made with ❤️ by the AKER Team**
