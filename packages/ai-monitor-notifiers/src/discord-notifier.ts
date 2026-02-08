import type { IAlert, IDailyReport, IDeployment, INotifier, IPipelineStatus } from '@aker/ai-monitor-core';

/**
 * Discord Notifier
 *
 * Sends notifications to Discord via Webhook with rich embeds.
 */

export interface IDiscordConfig {
  /** Discord Webhook URL */
  webhookUrl: string;
  /** Bot username override (optional) */
  username?: string;
  /** Bot avatar URL override (optional) */
  avatarUrl?: string;
}

// Discord embed color mapping
const SEVERITY_COLORS: Record<string, number> = {
  CRITICAL: 0xed4245, // Red
  WARNING: 0xfee75c, // Yellow
  INFO: 0x57f287, // Green
};

const STATUS_COLORS: Record<string, number> = {
  SUCCESS: 0x57f287, // Green
  FAILURE: 0xed4245, // Red
  ABORTED: 0x99aab5, // Grey
  UNSTABLE: 0xfee75c, // Yellow
};

const SEVERITY_EMOJI: Record<string, string> = {
  CRITICAL: '🚨',
  WARNING: '⚠️',
  INFO: 'ℹ️',
};

export class DiscordNotifier implements INotifier {
  private config: IDiscordConfig;
  private axios: any;

  constructor(config: IDiscordConfig) {
    this.config = config;

    try {
      this.axios = require('axios');
    } catch {
      throw new Error('DiscordNotifier requires axios. Install with: npm install axios');
    }
  }

  async send(message: string): Promise<void> {
    await this.post({ content: message });
  }

  async sendAlert(alert: IAlert): Promise<void> {
    const emoji = SEVERITY_EMOJI[alert.severity] || '📢';
    const color = SEVERITY_COLORS[alert.severity] || 0x5865f2;

    const embed: any = {
      title: `${emoji} ${alert.title}`,
      description: alert.message,
      color,
      timestamp: alert.timestamp?.toISOString() || new Date().toISOString(),
      footer: { text: 'AI Monitor' },
      fields: [{ name: 'Severity', value: alert.severity, inline: true }],
    };

    if (alert.metrics) {
      embed.fields.push({
        name: 'Metrics',
        value: `\`\`\`json\n${JSON.stringify(alert.metrics, null, 2)}\n\`\`\``,
        inline: false,
      });
    }

    await this.post({ embeds: [embed] });
  }

  async sendPipelineStatus(status: IPipelineStatus): Promise<void> {
    const statusEmoji = status.status === 'SUCCESS' ? '✅' : status.status === 'FAILURE' ? '❌' : '⚠️';
    const color = STATUS_COLORS[status.status] || 0x5865f2;

    const fields: any[] = [
      { name: 'Job', value: status.jobName, inline: true },
      { name: 'Build', value: `#${status.buildNumber}`, inline: true },
      { name: 'Status', value: status.status, inline: true },
    ];

    if (status.duration) {
      fields.push({ name: 'Duration', value: `${status.duration}s`, inline: true });
    }
    if (status.changes && status.changes.length > 0) {
      fields.push({ name: 'Changes', value: status.changes.map((c) => `• ${c}`).join('\n'), inline: false });
    }

    await this.post({
      embeds: [
        {
          title: `${statusEmoji} Pipeline ${status.status}`,
          color,
          fields,
          footer: { text: 'AI Monitor' },
          url: status.url,
        },
      ],
    });
  }

  async sendDeploymentNotification(deployment: IDeployment): Promise<void> {
    const emoji = deployment.status === 'SUCCESS' ? '🚀' : '❌';
    const color = STATUS_COLORS[deployment.status] || 0x5865f2;

    const fields: any[] = [
      { name: 'Environment', value: deployment.environment, inline: true },
      { name: 'Version', value: deployment.version, inline: true },
      { name: 'Status', value: deployment.status, inline: true },
    ];

    if (deployment.duration) {
      fields.push({ name: 'Duration', value: `${deployment.duration}s`, inline: true });
    }
    if (deployment.changes && deployment.changes.length > 0) {
      fields.push({ name: 'Changes', value: deployment.changes.map((c) => `• ${c}`).join('\n'), inline: false });
    }

    await this.post({
      embeds: [
        {
          title: `${emoji} Deployment to ${deployment.environment}`,
          color,
          fields,
          footer: { text: 'AI Monitor' },
          url: deployment.url,
        },
      ],
    });
  }

  async sendDailyReport(report: IDailyReport): Promise<void> {
    await this.post({
      embeds: [
        {
          title: '📊 Daily Health Report',
          color: 0x5865f2,
          fields: [
            { name: 'Total Alerts', value: String(report.totalAlerts), inline: true },
            { name: 'Critical', value: String(report.criticalAlerts), inline: true },
            { name: 'Auto-Fixed', value: String(report.autoFixes), inline: true },
            { name: 'Uptime', value: report.uptime, inline: true },
            { name: 'Top Issues', value: report.topIssues.map((i) => `• ${i}`).join('\n') || 'None', inline: false },
          ],
          timestamp: report.date.toISOString(),
          footer: { text: 'AI Monitor' },
        },
      ],
    });
  }

  private async post(payload: Record<string, any>): Promise<void> {
    const body: any = { ...payload };
    if (this.config.username) body.username = this.config.username;
    if (this.config.avatarUrl) body.avatar_url = this.config.avatarUrl;

    await this.axios.post(this.config.webhookUrl, body);
  }
}
