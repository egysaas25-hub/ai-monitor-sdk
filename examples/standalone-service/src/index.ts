import 'dotenv/config';
import winston from 'winston';
import { AIMonitor, WinstonLoggerAdapter } from '@aker/ai-monitor-core';
import { TelegramNotifier } from '@aker/ai-monitor-notifiers';

/**
 * Example: AI Monitor as a standalone service
 * This demonstrates how to use the plug-and-play packages
 */

// Create Winston logger
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
      }
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || '/app/logs/ai-monitor.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Create notifiers based on configuration
const notifiers: any[] = [];

// Add Telegram notifier if configured
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  notifiers.push(
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID
    })
  );
  winstonLogger.info('Telegram notifier configured');
}

// Create AI Monitor instance
const monitor = new AIMonitor({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '3333', 10),
  enabled: process.env.AI_MONITOR_ENABLED?.toLowerCase() !== 'false',
  notifiers: notifiers,
  logger: new WinstonLoggerAdapter(winstonLogger),
  sendTestNotification: process.env.SEND_TEST_NOTIFICATION === 'true',
  testNotificationDelay: parseInt(process.env.TEST_NOTIFICATION_DELAY || '3000', 10)
});

// Graceful shutdown
process.on('SIGINT', async () => {
  winstonLogger.info('Shutting down gracefully...');
  await monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  winstonLogger.info('Shutting down gracefully...');
  await monitor.stop();
  process.exit(0);
});

// Start the monitor
monitor.start().catch((error) => {
  winstonLogger.error('Failed to start AI Monitor:', error);
  process.exit(1);
});

// Export for programmatic use
export { monitor };
