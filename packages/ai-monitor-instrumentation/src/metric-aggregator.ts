import type { IInstrumentationConfig, IThresholds } from './types';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Aggregates metrics for P95 and Error Rate calculations
 * Implements a sliding window for real-time analysis
 */
export class MetricAggregator {
  private config: Required<IInstrumentationConfig>;
  private responseTimes: number[] = [];
  private requestCount: number = 0;
  private errorCount: number = 0;
  private intervalId: any = null;

  // Defaults per user requirement
  private readonly DEFAULT_THRESHOLDS: Required<IThresholds> = {
    responseTime: { warning: 200, critical: 500 },
    errorRate: { warning: 0.1, critical: 1.0 }, // percentages
    cpu: { warning: 0.5, critical: 0.7 },
    memory: { warning: 0.6, critical: 0.8 },
    dbConnections: { warning: 0.5, critical: 0.8 },
    queueLength: { warning: 100, critical: 1000 }
  };

  private thresholds: Required<IThresholds>;

  constructor(config: Required<IInstrumentationConfig>) {
    this.config = config;
    this.thresholds = {
      ...this.DEFAULT_THRESHOLDS,
      ...config.thresholds
    } as Required<IThresholds>;
  }

  start(): void {
    // Aggregate every minute
    this.intervalId = setInterval(() => this.aggregateAndAlert(), 60000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Record a request duration
   */
  recordRequest(duration: number, isError: boolean): void {
    this.responseTimes.push(duration);
    this.requestCount++;
    if (isError) this.errorCount++;
  }

  /**
   * Calculate metrics and alert if needed
   */
  private async aggregateAndAlert(): Promise<void> {
    if (this.responseTimes.length === 0) return;

    // 1. Calculate P95 Response Time
    this.responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(this.responseTimes.length * 0.95);
    const p95 = this.responseTimes[p95Index];

    // 2. Calculate Error Rate
    const errorRate = (this.errorCount / this.requestCount) * 100;

    // 3. Check Response Time Thresholds
    if (p95 > this.thresholds.responseTime.critical) {
      await this.config.monitor.alert({
        severity: 'CRITICAL',
        title: 'Critical Latency (P95)',
        message: `P95 Response time is ${p95}ms (Critical > ${this.thresholds.responseTime.critical}ms)`,
        metrics: { p95, threshold: this.thresholds.responseTime.critical, action: 'Optimize queries' }
      });
    } else if (p95 > this.thresholds.responseTime.warning) {
      await this.config.monitor.alert({
        severity: 'WARNING',
        title: 'High Latency (P95)',
        message: `P95 Response time is ${p95}ms (Warning > ${this.thresholds.responseTime.warning}ms)`,
        metrics: { p95, threshold: this.thresholds.responseTime.warning, action: 'Optimize queries' }
      });
    }

    // 4. Check Error Rate Thresholds
    if (errorRate > this.thresholds.errorRate.critical) {
      await this.config.monitor.alert({
        severity: 'CRITICAL',
        title: 'Critical Error Rate',
        message: `Error rate is ${errorRate.toFixed(2)}% (Critical > ${this.thresholds.errorRate.critical}%)`,
        metrics: { errorRate, threshold: this.thresholds.errorRate.critical, action: 'Investigate errors' }
      });
    } else if (errorRate > this.thresholds.errorRate.warning) {
      await this.config.monitor.alert({
        severity: 'WARNING',
        title: 'Elevated Error Rate',
        message: `Error rate is ${errorRate.toFixed(2)}% (Warning > ${this.thresholds.errorRate.warning}%)`,
        metrics: { errorRate, threshold: this.thresholds.errorRate.warning, action: 'Investigate errors' }
      });
    }

    // Reset window
    this.responseTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Get current thresholds (useful for other components)
   */
  getThresholds(): Required<IThresholds> {
    return this.thresholds;
  }
}
