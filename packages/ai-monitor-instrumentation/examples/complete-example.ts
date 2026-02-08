/**
 * Complete Example: Plug-and-Play Monitoring
 *
 * Shows the complete setup - three packages working together:
 * 1. @aker/ai-monitor-core - Core monitoring + AI
 * 2. @aker/ai-monitor-notifiers - Notification channels
 * 3. @aker/ai-monitor-instrumentation - Auto-instrumentation
 */

import { AIMonitor } from '@aker/ai-monitor-core';
import { Instrumentation } from '@aker/ai-monitor-instrumentation';
import { MultiNotifier, SlackNotifier, TelegramNotifier } from '@aker/ai-monitor-notifiers';
import express from 'express';

// ============================================================================
// STEP 1: Create the monitor with AI and notifications
// ============================================================================

const monitor = new AIMonitor({
  port: 3333,

  // AI Analysis (optional but recommended)
  aiConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: true,
    features: {
      anomalyDetection: true,
      rootCauseAnalysis: true,
      autoHealing: true,
    },
  },

  // Multi-channel notifications
  notifiers: new MultiNotifier({
    notifiers: [
      new TelegramNotifier({
        token: process.env.TELEGRAM_BOT_TOKEN!,
        chatId: process.env.TELEGRAM_CHAT_ID!,
      }),
      new SlackNotifier({
        webhookUrl: process.env.SLACK_WEBHOOK_URL!,
      }),
    ],
  }),
});

await monitor.start();

// ============================================================================
// STEP 2: Setup auto-instrumentation
// ============================================================================

const instrumentation = new Instrumentation({
  monitor, // Pass the monitor
  appName: 'my-awesome-app',
  environment: process.env.NODE_ENV || 'development',

  // Thresholds
  performanceThreshold: 500, // Alert if requests > 500ms
  memoryThreshold: 0.85, // Alert if memory > 85%
  cpuThreshold: 0.75, // Alert if CPU > 75%

  // Features
  captureErrors: true, // Auto-capture all errors
  capturePerformance: true, // Auto-track slow operations
  captureHttp: true, // Auto-monitor HTTP requests
  captureSystemMetrics: true, // Auto-monitor CPU/memory

  // Error filter (optional)
  errorFilter: (error) => {
    // Ignore certain errors
    return !error.message.includes('ECONNRESET');
  },
});

// Start auto-instrumentation
instrumentation.start();

// ============================================================================
// STEP 3: Build your app - it's automatically monitored!
// ============================================================================

const app = express();

// Add monitoring middleware (monitors all HTTP requests automatically)
app.use(instrumentation.httpMiddleware());

app.use(express.json());

// Example route - automatically monitored!
app.get('/api/users', async (req, res) => {
  try {
    // This will be monitored for performance
    const users = await fetchUsers();
    res.json(users);
  } catch (error) {
    // This error is automatically captured!
    throw error;
  }
});

// Example slow route - will trigger performance alert
app.get('/api/slow', async (req, res) => {
  // Simulate slow operation
  await new Promise((resolve) => setTimeout(resolve, 600)); // > 500ms threshold
  res.json({ message: 'This took too long!' });
});

// Example error route - will trigger error alert
app.get('/api/error', async (req, res) => {
  throw new Error('This is a test error!');
});

// Example manual measurement
app.get('/api/data', async (req, res) => {
  // Manually measure a specific operation
  const data = await instrumentation.measure('fetch-external-api', async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  });

  res.json(data);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📊 Monitoring dashboard: http://localhost:3333/health');
  console.log('');
  console.log('✅ Active monitoring:');
  console.log('   • All errors are automatically captured');
  console.log('   • All HTTP requests are monitored');
  console.log('   • CPU and memory are tracked every 60s');
  console.log('   • Slow operations trigger alerts (> 500ms)');
  console.log('   • AI analyzes all issues automatically');
  console.log('');
  console.log('Try these endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/users - Normal operation`);
  console.log(`   GET  http://localhost:${PORT}/api/slow - Triggers performance alert`);
  console.log(`   GET  http://localhost:${PORT}/api/error - Triggers error alert`);
});

// ============================================================================
// Helper functions
// ============================================================================

async function fetchUsers() {
  // Simulate database query
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
}

// ============================================================================
// THAT'S IT! Your app is now fully monitored!
// ============================================================================

// What happens automatically:
//
// 1. ALL ERRORS are captured and sent to Telegram + Slack
//    - With stack traces
//    - With AI analysis (root cause + suggestions)
//
// 2. SLOW OPERATIONS are detected and alerted
//    - HTTP requests > 500ms
//    - Functions you measure manually
//
// 3. SYSTEM ISSUES are monitored
//    - High CPU (> 75%)
//    - High memory (> 85%)
//
// 4. HTTP REQUESTS are tracked
//    - Response times
//    - Status codes
//    - 500 errors trigger alerts
//
// 5. AI ANALYSIS on everything
//    - Anomaly detection
//    - Root cause analysis
//    - Auto-healing suggestions

export { monitor, instrumentation, app };
