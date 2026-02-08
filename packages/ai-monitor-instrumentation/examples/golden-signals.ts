/**
 * Golden Signals Monitoring Example
 *
 * This example demonstrates how to implement the specific "Golden Signals" monitoring
 * stack requested: Prometheus metrics, P95 latency, Error Rates, and Resource Saturation.
 */

import { AIMonitor } from '@aker/ai-monitor-core';
import { Instrumentation } from '@aker/ai-monitor-instrumentation';
import { TelegramNotifier } from '@aker/ai-monitor-notifiers';
import express from 'express';

// 1. Setup Monitor (Alerting)
const monitor = new AIMonitor({
  notifiers: [
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
  ],
});
await monitor.start();

// 2. Setup Instrumentation with Specific Thresholds
// Matching the table:
// | Metric | Good | Warning | Critical |
// | Response Time | <200ms | 200-500ms | >500ms |
// | Error Rate | <0.1% | 0.1-1% | >1% |
// | CPU | <50% | 50-70% | >70% |
// | Memory | <60% | 60-80% | >80% |
// | DB Connections | <50% | 50-80% | >80% |
// | Queue Length | <100 | 100-1000 | >1000 |

const instrumentation = new Instrumentation({
  monitor,
  appName: 'golden-signals-app',

  // Enable Prometheus /metrics
  enablePrometheus: true,

  thresholds: {
    responseTime: { warning: 200, critical: 500 },
    errorRate: { warning: 0.1, critical: 1.0 },
    cpu: { warning: 0.5, critical: 0.7 },
    memory: { warning: 0.6, critical: 0.8 },
    dbConnections: { warning: 50, critical: 80 }, // assuming 50%
    queueLength: { warning: 100, critical: 1000 },
  },
});

// 3. Register Resource Monitors (Plug your own logic)
instrumentation.monitorDbConnection(async () => {
  // Return current DB connection usage %
  // const used = await db.pool.active();
  // const max = await db.pool.max();
  // return (used / max) * 100;
  return 45; // Test value
});

instrumentation.monitorQueueLength(async () => {
  // Return current queue length
  // return await redis.llen('jobs');
  return 50; // Test value
});

instrumentation.start();

// 4. Run App
const app = express();
app.use(instrumentation.httpMiddleware());

app.get('/api/fast', (_req, res) => res.json({ status: 'ok' })); // < 200ms
app.get('/api/slow', async (_req, res) => {
  await new Promise((r) => setTimeout(r, 600)); // > 500ms -> CRITICAL ALERT
  res.json({ status: 'slow' });
});

app.listen(3000, () => {
  console.log('Server running on 3000');
  console.log('Prometheus metrics available at http://localhost:3000/metrics');
});
