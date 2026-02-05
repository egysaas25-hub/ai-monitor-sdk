import type {
  INotifier,
  IAlert,
  IPipelineStatus,
  IDeployment,
  IDailyReport
} from '@aker/ai-monitor-core';

/**
 * Slack notifier configuration
 */
export interface ISlackConfig {
  webhookUrl: string;
}

/**
 * Slack notifier implementation
 * Sends notifications to Slack via webhook
 */
export class SlackNotifier implements INotifier {
  private webhookUrl: string;
  private axios: any;
  private enabled: boolean = false;

  constructor(config: ISlackConfig) {
    this.webhookUrl = config.webhookUrl;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.axios = require('axios');
      this.enabled = true;
    } catch (error) {
      console.error('Failed to initialize Slack notifier. Make sure "axios" package is installed.');
      console.error('Install with: npm install axios');
      this.enabled = false;
    }
  }

  async send(message: string): Promise<void> {
    if (!this.enabled) {
      console.warn('Slack notifier disabled - skipping notification');
      return;
    }

    try {
      await this.axios.post(this.webhookUrl, {
        text: message
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  async sendAlert(alert: IAlert): Promise<void> {
    if (!this.enabled) return;

    const emoji = this.getSeverityEmoji(alert.severity);
    const timestamp = alert.timestamp || new Date();
    const color = this.getSeverityColor(alert.severity);

    const fields: any[] = [
      {
        title: 'Severity',
        value: alert.severity,
        short: true
      },
      {
        title: 'Time',
        value: timestamp.toISOString(),
        short: true
      }
    ];

    if (alert.metrics) {
      fields.push({
        title: 'Metrics',
        value: `\`\`\`${JSON.stringify(alert.metrics, null, 2).substring(0, 500)}\`\`\``,
        short: false
      });
    }

    await this.axios.post(this.webhookUrl, {
      attachments: [
        {
          color: color,
          title: `${emoji} ${alert.title}`,
          text: alert.message,
          fields: fields,
          footer: 'AI Monitor',
          ts: Math.floor(timestamp.getTime() / 1000)
        }
      ]
    });
  }

  async sendPipelineStatus(status: IPipelineStatus): Promise<void> {
    if (!this.enabled) return;

    const emoji = this.getStatusEmoji(status.status);
    const color = this.getStatusColor(status.status);

    const fields: any[] = [
      {
        title: 'Status',
        value: status.status,
        short: true
      }
    ];

    if (status.duration) {
      fields.push({
        title: 'Duration',
        value: this.formatDuration(status.duration),
        short: true
      });
    }

    if (status.changes && status.changes.length > 0) {
      fields.push({
        title: 'Changes',
        value: status.changes.map((c) => `• ${c}`).join('\n'),
        short: false
      });
    }

    const attachment: any = {
      color: color,
      title: `${emoji} ${status.jobName} - Build #${status.buildNumber}`,
      fields: fields,
      footer: 'AI Monitor'
    };

    if (status.url) {
      attachment.title_link = status.url;
    }

    await this.axios.post(this.webhookUrl, {
      attachments: [attachment]
    });
  }

  async sendDeploymentNotification(deployment: IDeployment): Promise<void> {
    if (!this.enabled) return;

    const emoji = deployment.status === 'SUCCESS' ? '✅' : '❌';
    const color = deployment.status === 'SUCCESS' ? 'good' : 'danger';

    const fields: any[] = [
      {
        title: 'Environment',
        value: deployment.environment,
        short: true
      },
      {
        title: 'Version',
        value: deployment.version,
        short: true
      },
      {
        title: 'Status',
        value: deployment.status,
        short: true
      }
    ];

    if (deployment.duration) {
      fields.push({
        title: 'Duration',
        value: this.formatDuration(deployment.duration),
        short: true
      });
    }

    if (deployment.changes && deployment.changes.length > 0) {
      fields.push({
        title: 'Changes',
        value: deployment.changes.map((c) => `• ${c}`).join('\n'),
        short: false
      });
    }

    const attachment: any = {
      color: color,
      title: `${emoji} Deployment`,
      fields: fields,
      footer: 'AI Monitor'
    };

    if (deployment.url) {
      attachment.title_link = deployment.url;
    }

    await this.axios.post(this.webhookUrl, {
      attachments: [attachment]
    });
  }

  async sendDailyReport(report: IDailyReport): Promise<void> {
    if (!this.enabled) return;

    const overallStatus = report.totalAlerts === 0 ? '✅ Healthy' : '⚠️ Issues Found';
    const color = report.totalAlerts === 0 ? 'good' : 'warning';

    const fields: any[] = [
      {
        title: 'Total Alerts',
        value: report.totalAlerts.toString(),
        short: true
      },
      {
        title: 'Critical',
        value: report.criticalAlerts.toString(),
        short: true
      },
      {
        title: 'Auto-Fixed',
        value: report.autoFixes.toString(),
        short: true
      },
      {
        title: 'Uptime',
        value: report.uptime,
        short: true
      }
    ];

    if (report.topIssues.length > 0) {
      fields.push({
        title: 'Top Issues',
        value: report.topIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n'),
        short: false
      });
    }

    await this.axios.post(this.webhookUrl, {
      attachments: [
        {
          color: color,
          title: `📊 Daily Health Report - ${report.date.toLocaleDateString()}`,
          text: `*Overall Status:* ${overallStatus}`,
          fields: fields,
          footer: 'AI Monitor'
        }
      ]
    });
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'danger';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'good';
      default:
        return '#808080';
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '✅';
      case 'FAILURE':
        return '❌';
      case 'ABORTED':
        return '⏹️';
      case 'UNSTABLE':
        return '⚠️';
      default:
        return '📋';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'good';
      case 'FAILURE':
        return 'danger';
      case 'ABORTED':
        return '#808080';
      case 'UNSTABLE':
        return 'warning';
      default:
        return '#808080';
    }
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
}
