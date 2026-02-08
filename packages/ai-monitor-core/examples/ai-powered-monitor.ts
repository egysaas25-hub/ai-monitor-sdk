/**
 * Example: AI-Powered Monitoring in Any Project
 *
 * Shows how to use the AI Monitor to analyze logs, detect anomalies,
 * and get intelligent insights in any Node.js application
 */

import { AIMonitor, AIService } from '@aker/ai-monitor-core';
import { TelegramNotifier } from '@aker/ai-monitor-notifiers';

// Create monitor with AI enabled
const monitor = new AIMonitor({
  port: 3333,
  aiConfig: {
    apiKey: process.env.OPENAI_API_KEY, // or ANTHROPIC_API_KEY
    enabled: true,
    features: {
      anomalyDetection: true,
      rootCauseAnalysis: true,
      autoHealing: true,
      patternRecognition: true,
    },
  },
  enableAIEnhancedAlerts: true, // AI will analyze all alerts
  notifiers: [
    new TelegramNotifier({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
  ],
});

await monitor.start();

// Example 1: Send alert - AI will automatically analyze it
await monitor.alert({
  severity: 'CRITICAL',
  title: 'Database Connection Error',
  message: 'Connection pool exhausted after 30s timeout',
  metrics: {
    activeConnections: 50,
    maxConnections: 50,
    queuedRequests: 120,
    responseTime: 30000,
  },
});

// AI will:
// 1. Analyze the error
// 2. Determine root cause (connection pool too small)
// 3. Suggest fixes (increase pool size, add connection retry logic)
// 4. Assess severity
// 5. Check if it's anomalous

// Example 2: Use AI service directly for custom analysis
const aiService = new AIService({
  apiKey: process.env.OPENAI_API_KEY!,
  enabled: true,
});

// Analyze logs for patterns
const logs = [
  { timestamp: new Date(), level: 'ERROR', message: 'Connection timeout' },
  { timestamp: new Date(), level: 'ERROR', message: 'Connection timeout' },
  { message: 'Connection timeout' },
  { timestamp: new Date(), level: 'WARN', message: 'Slow query: 5.2s' },
];

const analysis = await aiService.analyzeLogs(logs);
console.log('AI Analysis:', analysis);
// {
//   severity: 'HIGH',
//   summary: 'Recurring connection timeout pattern detected',
//   rootCause: 'Database server overloaded or network latency',
//   suggestions: [
//     'Check database server CPU/memory',
//     'Increase connection timeout',
//     'Add connection pooling'
//   ],
//   isAnomaly: true,
//   confidence: 0.85,
//   relatedPatterns: ['timeout-spike', 'slow-queries']
// }

// Example 3: Analyze metrics for anomalies
const metrics = [
  { name: 'cpu_usage', value: 95, timestamp: new Date() },
  { name: 'memory_usage', value: 88, timestamp: new Date() },
  { name: 'response_time', value: 4500, timestamp: new Date() },
];

const metricsAnalysis = await aiService.analyzeMetrics(metrics);
console.log('Metrics Analysis:', metricsAnalysis);

// Example 4: Get auto-healing suggestion
const healingSuggestion = await aiService.suggestAutoHeal('High CPU usage detected', {
  currentCPU: 95,
  threshold: 80,
  duration: '10m',
});

console.log('Auto-Heal:', healingSuggestion.autoHealCommand);
// "kubectl scale deployment myapp --replicas=5"

export { monitor, aiService };
