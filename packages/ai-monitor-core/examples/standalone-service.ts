/**
 * Example: Standalone Monitoring Service
 *
 * This is the classic use case - running AI Monitor as a dedicated service
 * that receives alerts from other services via HTTP endpoints.
 */

import { AIMonitor, createConfig } from '@momen124/ai-monitor-core';
import { EmailNotifier, MultiNotifier, SlackNotifier, TelegramNotifier } from '@momen124/ai-monitor-notifiers';
import 'dotenv/config';

// Create notifiers
const notifiers = [];

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  notifiers.push(
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    }),
  );
  console.log('âœ… Telegram notifier enabled');
}

if (process.env.SLACK_WEBHOOK_URL) {
  notifiers.push(
    new SlackNotifier({
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    }),
  );
  console.log('âœ… Slack notifier enabled');
}

if (process.env.SMTP_HOST && process.env.EMAIL_TO) {
  notifiers.push(
    new EmailNotifier({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      from: process.env.EMAIL_FROM!,
      to: process.env.EMAIL_TO.split(','),
    }),
  );
  console.log('âœ… Email notifier enabled');
}

// Create monitor configuration
const config = createConfig({ fromEnv: true })
  .notifiers(notifiers.length > 1 ? new MultiNotifier({ notifiers }) : notifiers[0])
  .sendTestNotification(true, 3000)
  .build();

// Create and start monitor
const monitor = new AIMonitor(config);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nðŸ›‘ Shutting down gracefully...');
  await monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nðŸ›‘ Shutting down gracefully...');
  await monitor.stop();
  process.exit(0);
});

// Start
(async () => {
  try {
    await monitor.start();
    console.log('\nðŸ“Š Monitoring Dashboard:');
    console.log(`   Health Check: curl http://localhost:${config.port}/health`);
    console.log(
      `   Send Alert:   curl -X POST http://localhost:${config.port}/alert -H "Content-Type: application/json" -d '{"severity":"INFO","title":"Test","message":"Hello"}'`,
    );
    console.log('\nðŸ”” Notifiers:', notifiers.length);
    console.log('âœ… Press Ctrl+C to stop\n');
  } catch (error) {
    console.error('âŒ Failed to start AI Monitor:', error);
    process.exit(1);
  }
})();

export { monitor };
