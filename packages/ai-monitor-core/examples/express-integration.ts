/**
 * Example: Express.js Integration
 *
 * This example shows how to integrate AI Monitor into an Express.js application
 * for automatic error tracking and request monitoring.
 */

import { AIMonitor, WinstonLoggerAdapter } from '@aker/ai-monitor-core';
import { MultiNotifier, TelegramNotifier } from '@aker/ai-monitor-notifiers';
import express from 'express';
import winston from 'winston';

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Create AI Monitor
const monitor = new AIMonitor({
  port: 4000, // Run on different port than your app
  logger: new WinstonLoggerAdapter(logger),
  notifiers: [
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
  ],
});

// Start monitor
await monitor.start();

// Create Express app
const app = express();

app.use(express.json());

// Request duration tracking
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Alert on slow requests
    if (duration > 5000) {
      monitor.alert({
        severity: 'WARNING',
        title: 'Slow Request Detected',
        message: `${req.method} ${req.path} took ${duration}ms`,
        metrics: { duration, method: req.method, path: req.path },
      });
    }
  });

  next();
});

// Your routes
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/error', (req, res) => {
  throw new Error('Test error');
});

// Error monitoring middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Send alert for errors
  monitor.alert({
    severity: 'CRITICAL',
    title: 'Express Error',
    message: err.message,
    metrics: {
      stack: err.stack,
      method: req.method,
      path: req.path,
      body: req.body,
    },
  });

  res.status(500).json({ error: 'Internal server error' });
});

// Start app
const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Express app listening on port ${PORT}`);
  logger.info('AI Monitor running on port 4000');
});

export { app, monitor };
