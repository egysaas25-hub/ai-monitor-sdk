import type { IAlert, ILogger } from '@momen124/ai-monitor-core';
import { ConsoleLogger } from '@momen124/ai-monitor-core';

/**
 * Queue health metrics snapshot.
 */
export interface IQueueMetrics {
  /** Current queue depth (enqueued - dequeued) */
  depth: number;
  /** Total enqueued since last reset */
  totalEnqueued: number;
  /** Total dequeued since last reset */
  totalDequeued: number;
  /** Total processing errors since last reset */
  totalErrors: number;
  /** Average processing duration in ms */
  avgProcessingMs: number;
}

type AlertFn = (alert: IAlert) => Promise<void>;

/**
 * QueueMonitor tracks queue depth, processing rate, consumer lag,
 * and fires alerts when thresholds are exceeded.
 */
export class QueueMonitor {
  private enqueueCount = 0;
  private dequeueCount = 0;
  private errorCount = 0;
  private totalProcessingMs = 0;
  private processedItems = 0;
  private alertFn: AlertFn;
  private logger: ILogger;
  private depthWarning: number;
  private depthCritical: number;
  private lastAlertSeverity: string | null = null;

  constructor(
    alertFn: AlertFn,
    opts?: {
      logger?: ILogger;
      depthWarning?: number;
      depthCritical?: number;
    },
  ) {
    this.alertFn = alertFn;
    this.logger = opts?.logger ?? new ConsoleLogger();
    this.depthWarning = opts?.depthWarning ?? 100;
    this.depthCritical = opts?.depthCritical ?? 1000;
  }

  /** Record an enqueue event. */
  recordEnqueue(count = 1): void {
    this.enqueueCount += count;
    this.checkThresholds();
  }

  /** Record a dequeue / processing completion. */
  recordDequeue(durationMs: number): void {
    this.dequeueCount++;
    this.totalProcessingMs += durationMs;
    this.processedItems++;
    this.checkThresholds();
  }

  /** Record a processing error. */
  recordError(): void {
    this.errorCount++;
  }

  /** Get current queue metrics. */
  getMetrics(): IQueueMetrics {
    return {
      depth: this.enqueueCount - this.dequeueCount,
      totalEnqueued: this.enqueueCount,
      totalDequeued: this.dequeueCount,
      totalErrors: this.errorCount,
      avgProcessingMs: this.processedItems > 0
        ? this.totalProcessingMs / this.processedItems
        : 0,
    };
  }

  /** Reset all counters. */
  reset(): void {
    this.enqueueCount = 0;
    this.dequeueCount = 0;
    this.errorCount = 0;
    this.totalProcessingMs = 0;
    this.processedItems = 0;
    this.lastAlertSeverity = null;
  }

  private checkThresholds(): void {
    const depth = this.enqueueCount - this.dequeueCount;

    if (depth >= this.depthCritical && this.lastAlertSeverity !== 'CRITICAL') {
      this.lastAlertSeverity = 'CRITICAL';
      this.alertFn({
        severity: 'CRITICAL',
        title: '🔴 Queue depth CRITICAL',
        message: `Queue depth is ${depth} (threshold: ${this.depthCritical})`,
        metrics: { depth, threshold: this.depthCritical },
        timestamp: new Date(),
      }).catch((e) => this.logger.error('Queue alert error:', e));
    } else if (depth >= this.depthWarning && depth < this.depthCritical && this.lastAlertSeverity !== 'WARNING') {
      this.lastAlertSeverity = 'WARNING';
      this.alertFn({
        severity: 'WARNING',
        title: '⚠️ Queue depth WARNING',
        message: `Queue depth is ${depth} (threshold: ${this.depthWarning})`,
        metrics: { depth, threshold: this.depthWarning },
        timestamp: new Date(),
      }).catch((e) => this.logger.error('Queue alert error:', e));
    } else if (depth < this.depthWarning) {
      this.lastAlertSeverity = null;
    }
  }
}
