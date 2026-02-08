import type { IAlert, IDailyReport, IDeployment, INotifier, IPipelineStatus } from '@aker/ai-monitor-core';

/**
 * Webhook Notifier
 *
 * Generic HTTP notifier — POST JSON to any URL.
 * Works with PagerDuty, Opsgenie, custom dashboards,
 * or any webhook consumer.
 */

export interface IWebhookConfig {
  /** Target webhook URL */
  url: string;
  /** HTTP method (default: 'POST') */
  method?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Max retry attempts (default: 3) */
  retries?: number;
  /** Base delay between retries in ms (default: 1000) — uses exponential backoff */
  retryDelayMs?: number;
}

export class WebhookNotifier implements INotifier {
  private config: Required<IWebhookConfig>;
  private axios: any;

  constructor(config: IWebhookConfig) {
    this.config = {
      url: config.url,
      method: config.method ?? 'POST',
      headers: config.headers ?? { 'Content-Type': 'application/json' },
      retries: config.retries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
    };

    try {
      this.axios = require('axios');
    } catch {
      throw new Error('WebhookNotifier requires axios. Install with: npm install axios');
    }
  }

  async send(message: string): Promise<void> {
    await this.post({ type: 'message', message, timestamp: new Date().toISOString() });
  }

  async sendAlert(alert: IAlert): Promise<void> {
    await this.post({
      type: 'alert',
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metrics: alert.metrics,
      timestamp: alert.timestamp?.toISOString() || new Date().toISOString(),
    });
  }

  async sendPipelineStatus(status: IPipelineStatus): Promise<void> {
    await this.post({ type: 'pipeline', ...status });
  }

  async sendDeploymentNotification(deployment: IDeployment): Promise<void> {
    await this.post({ type: 'deployment', ...deployment });
  }

  async sendDailyReport(report: IDailyReport): Promise<void> {
    await this.post({
      type: 'daily_report',
      ...report,
      date: report.date.toISOString(),
    });
  }

  /**
   * POST with exponential backoff retry.
   */
  private async post(payload: Record<string, any>): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        await this.axios({
          method: this.config.method,
          url: this.config.url,
          headers: this.config.headers,
          data: payload,
        });
        return; // Success
      } catch (error: any) {
        lastError = error;
        if (attempt < this.config.retries) {
          const delay = this.config.retryDelayMs * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }
}
