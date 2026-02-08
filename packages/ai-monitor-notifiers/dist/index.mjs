var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/discord-notifier.ts
var SEVERITY_COLORS = {
  CRITICAL: 15548997,
  // Red
  WARNING: 16705372,
  // Yellow
  INFO: 5763719
  // Green
};
var STATUS_COLORS = {
  SUCCESS: 5763719,
  // Green
  FAILURE: 15548997,
  // Red
  ABORTED: 10070709,
  // Grey
  UNSTABLE: 16705372
  // Yellow
};
var SEVERITY_EMOJI = {
  CRITICAL: "\u{1F6A8}",
  WARNING: "\u26A0\uFE0F",
  INFO: "\u2139\uFE0F"
};
var DiscordNotifier = class {
  constructor(config) {
    this.config = config;
    try {
      this.axios = __require("axios");
    } catch {
      throw new Error("DiscordNotifier requires axios. Install with: npm install axios");
    }
  }
  async send(message) {
    await this.post({ content: message });
  }
  async sendAlert(alert) {
    const emoji = SEVERITY_EMOJI[alert.severity] || "\u{1F4E2}";
    const color = SEVERITY_COLORS[alert.severity] || 5793266;
    const embed = {
      title: `${emoji} ${alert.title}`,
      description: alert.message,
      color,
      timestamp: alert.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
      footer: { text: "AI Monitor" },
      fields: [{ name: "Severity", value: alert.severity, inline: true }]
    };
    if (alert.metrics) {
      embed.fields.push({
        name: "Metrics",
        value: `\`\`\`json
${JSON.stringify(alert.metrics, null, 2)}
\`\`\``,
        inline: false
      });
    }
    await this.post({ embeds: [embed] });
  }
  async sendPipelineStatus(status) {
    const statusEmoji = status.status === "SUCCESS" ? "\u2705" : status.status === "FAILURE" ? "\u274C" : "\u26A0\uFE0F";
    const color = STATUS_COLORS[status.status] || 5793266;
    const fields = [
      { name: "Job", value: status.jobName, inline: true },
      { name: "Build", value: `#${status.buildNumber}`, inline: true },
      { name: "Status", value: status.status, inline: true }
    ];
    if (status.duration) {
      fields.push({ name: "Duration", value: `${status.duration}s`, inline: true });
    }
    if (status.changes && status.changes.length > 0) {
      fields.push({ name: "Changes", value: status.changes.map((c) => `\u2022 ${c}`).join("\n"), inline: false });
    }
    await this.post({
      embeds: [
        {
          title: `${statusEmoji} Pipeline ${status.status}`,
          color,
          fields,
          footer: { text: "AI Monitor" },
          url: status.url
        }
      ]
    });
  }
  async sendDeploymentNotification(deployment) {
    const emoji = deployment.status === "SUCCESS" ? "\u{1F680}" : "\u274C";
    const color = STATUS_COLORS[deployment.status] || 5793266;
    const fields = [
      { name: "Environment", value: deployment.environment, inline: true },
      { name: "Version", value: deployment.version, inline: true },
      { name: "Status", value: deployment.status, inline: true }
    ];
    if (deployment.duration) {
      fields.push({ name: "Duration", value: `${deployment.duration}s`, inline: true });
    }
    if (deployment.changes && deployment.changes.length > 0) {
      fields.push({ name: "Changes", value: deployment.changes.map((c) => `\u2022 ${c}`).join("\n"), inline: false });
    }
    await this.post({
      embeds: [
        {
          title: `${emoji} Deployment to ${deployment.environment}`,
          color,
          fields,
          footer: { text: "AI Monitor" },
          url: deployment.url
        }
      ]
    });
  }
  async sendDailyReport(report) {
    await this.post({
      embeds: [
        {
          title: "\u{1F4CA} Daily Health Report",
          color: 5793266,
          fields: [
            { name: "Total Alerts", value: String(report.totalAlerts), inline: true },
            { name: "Critical", value: String(report.criticalAlerts), inline: true },
            { name: "Auto-Fixed", value: String(report.autoFixes), inline: true },
            { name: "Uptime", value: report.uptime, inline: true },
            { name: "Top Issues", value: report.topIssues.map((i) => `\u2022 ${i}`).join("\n") || "None", inline: false }
          ],
          timestamp: report.date.toISOString(),
          footer: { text: "AI Monitor" }
        }
      ]
    });
  }
  async post(payload) {
    const body = { ...payload };
    if (this.config.username) body.username = this.config.username;
    if (this.config.avatarUrl) body.avatar_url = this.config.avatarUrl;
    await this.axios.post(this.config.webhookUrl, body);
  }
};

// src/email-notifier.ts
var EmailNotifier = class {
  constructor(config) {
    this.enabled = false;
    this.config = config;
    try {
      const nodemailer = __require("nodemailer");
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure ?? false,
        auth: config.auth
      });
      this.enabled = true;
    } catch (error) {
      console.error('Failed to initialize Email notifier. Make sure "nodemailer" package is installed.');
      console.error("Install with: npm install nodemailer");
      this.enabled = false;
    }
  }
  async send(message) {
    if (!this.enabled) {
      console.warn("Email notifier disabled - skipping notification");
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: this.config.to,
        subject: "AI Monitor Notification",
        text: message,
        html: `<pre>${message}</pre>`
      });
    } catch (error) {
      console.error("Failed to send Email notification:", error);
      throw error;
    }
  }
  async sendAlert(alert) {
    if (!this.enabled) return;
    const timestamp = alert.timestamp || /* @__PURE__ */ new Date();
    const subject = `[${alert.severity}] ${alert.title}`;
    const html = this.generateAlertHtml(alert, timestamp);
    const text = this.generateAlertText(alert, timestamp);
    await this.transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject,
      text,
      html
    });
  }
  async sendPipelineStatus(status) {
    if (!this.enabled) return;
    const subject = `Pipeline ${status.status}: ${status.jobName} #${status.buildNumber}`;
    const html = this.generatePipelineHtml(status);
    const text = this.generatePipelineText(status);
    await this.transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject,
      text,
      html
    });
  }
  async sendDeploymentNotification(deployment) {
    if (!this.enabled) return;
    const subject = `Deployment ${deployment.status}: ${deployment.environment} v${deployment.version}`;
    const html = this.generateDeploymentHtml(deployment);
    const text = this.generateDeploymentText(deployment);
    await this.transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject,
      text,
      html
    });
  }
  async sendDailyReport(report) {
    if (!this.enabled) return;
    const subject = `Daily Health Report - ${report.date.toLocaleDateString()}`;
    const html = this.generateReportHtml(report);
    const text = this.generateReportText(report);
    await this.transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject,
      text,
      html
    });
  }
  generateAlertHtml(alert, timestamp) {
    const severityColor = this.getSeverityColor(alert.severity);
    const metricsHtml = alert.metrics ? `<h3>Metrics</h3><pre>${JSON.stringify(alert.metrics, null, 2)}</pre>` : "";
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: ${severityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">${alert.severity}: ${alert.title}</h1>
        </div>
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <p>${alert.message}</p>
          <p><strong>Time:</strong> ${timestamp.toISOString()}</p>
          ${metricsHtml}
        </div>
        <div style="margin-top: 20px; color: #888; font-size: 12px;">
          Generated by AI Monitor
        </div>
      </div>
    `;
  }
  generateAlertText(alert, timestamp) {
    const metricsStr = alert.metrics ? `

Metrics:
${JSON.stringify(alert.metrics, null, 2)}` : "";
    return `
${alert.severity}: ${alert.title}

${alert.message}

Time: ${timestamp.toISOString()}${metricsStr}

---
Generated by AI Monitor
    `.trim();
  }
  generatePipelineHtml(status) {
    const statusColor = this.getStatusColor(status.status);
    const changesHtml = status.changes && status.changes.length > 0 ? `<h3>Changes</h3><ul>${status.changes.map((c) => `<li>${c}</li>`).join("")}</ul>` : "";
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: ${statusColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">${status.jobName} - Build #${status.buildNumber}</h1>
        </div>
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <p><strong>Status:</strong> ${status.status}</p>
          ${status.duration ? `<p><strong>Duration:</strong> ${this.formatDuration(status.duration)}</p>` : ""}
          ${status.url ? `<p><a href="${status.url}">View Build</a></p>` : ""}
          ${changesHtml}
        </div>
      </div>
    `;
  }
  generatePipelineText(status) {
    const changesStr = status.changes && status.changes.length > 0 ? `

Changes:
${status.changes.map((c) => `\u2022 ${c}`).join("\n")}` : "";
    return `
${status.jobName} - Build #${status.buildNumber}

Status: ${status.status}
${status.duration ? `Duration: ${this.formatDuration(status.duration)}` : ""}
${status.url ? `URL: ${status.url}` : ""}${changesStr}
    `.trim();
  }
  generateDeploymentHtml(deployment) {
    const statusColor = deployment.status === "SUCCESS" ? "#28a745" : "#dc3545";
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: ${statusColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Deployment - ${deployment.environment}</h1>
        </div>
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <p><strong>Version:</strong> ${deployment.version}</p>
          <p><strong>Status:</strong> ${deployment.status}</p>
          ${deployment.duration ? `<p><strong>Duration:</strong> ${this.formatDuration(deployment.duration)}</p>` : ""}
          ${deployment.url ? `<p><a href="${deployment.url}">View Environment</a></p>` : ""}
        </div>
      </div>
    `;
  }
  generateDeploymentText(deployment) {
    return `
Deployment - ${deployment.environment}

Version: ${deployment.version}
Status: ${deployment.status}
${deployment.duration ? `Duration: ${this.formatDuration(deployment.duration)}` : ""}
${deployment.url ? `URL: ${deployment.url}` : ""}
    `.trim();
  }
  generateReportHtml(report) {
    const overallStatus = report.totalAlerts === 0 ? "\u2705 Healthy" : "\u26A0\uFE0F Issues Found";
    const topIssuesHtml = report.topIssues.length > 0 ? `<h3>Top Issues</h3><ol>${report.topIssues.map((issue) => `<li>${issue}</li>`).join("")}</ol>` : "";
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">\u{1F4CA} Daily Health Report</h1>
          <p style="margin: 5px 0 0 0;">${report.date.toLocaleDateString()}</p>
        </div>
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <h2>Overall Status: ${overallStatus}</h2>
          <ul>
            <li><strong>Total Alerts:</strong> ${report.totalAlerts}</li>
            <li><strong>Critical:</strong> ${report.criticalAlerts}</li>
            <li><strong>Auto-Fixed:</strong> ${report.autoFixes}</li>
            <li><strong>Uptime:</strong> ${report.uptime}</li>
          </ul>
          ${topIssuesHtml}
        </div>
      </div>
    `;
  }
  generateReportText(report) {
    const overallStatus = report.totalAlerts === 0 ? "\u2705 Healthy" : "\u26A0\uFE0F Issues Found";
    const topIssuesStr = report.topIssues.length > 0 ? `

Top Issues:
${report.topIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}` : "";
    return `
\u{1F4CA} Daily Health Report - ${report.date.toLocaleDateString()}

Overall Status: ${overallStatus}

Summary:
\u2022 Total Alerts: ${report.totalAlerts}
\u2022 Critical: ${report.criticalAlerts}
\u2022 Auto-Fixed: ${report.autoFixes}
\u2022 Uptime: ${report.uptime}${topIssuesStr}
    `.trim();
  }
  getSeverityColor(severity) {
    switch (severity) {
      case "CRITICAL":
        return "#dc3545";
      case "WARNING":
        return "#ffc107";
      case "INFO":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  }
  getStatusColor(status) {
    switch (status) {
      case "SUCCESS":
        return "#28a745";
      case "FAILURE":
        return "#dc3545";
      case "ABORTED":
        return "#6c757d";
      case "UNSTABLE":
        return "#ffc107";
      default:
        return "#6c757d";
    }
  }
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
  }
};

// src/multi-notifier.ts
var MultiNotifier = class {
  constructor(config) {
    this.notifiers = config.notifiers;
    this.stopOnFirstError = config.stopOnFirstError ?? false;
  }
  async send(message) {
    await this.executeOnAll(async (notifier) => notifier.send(message));
  }
  async sendAlert(alert) {
    await this.executeOnAll(async (notifier) => notifier.sendAlert(alert));
  }
  async sendPipelineStatus(status) {
    await this.executeOnAll(async (notifier) => notifier.sendPipelineStatus(status));
  }
  async sendDeploymentNotification(deployment) {
    await this.executeOnAll(async (notifier) => notifier.sendDeploymentNotification(deployment));
  }
  async sendDailyReport(report) {
    await this.executeOnAll(async (notifier) => notifier.sendDailyReport(report));
  }
  /**
   * Execute action on all notifiers
   * Handles partial failures based on stopOnFirstError setting
   */
  async executeOnAll(action) {
    if (this.stopOnFirstError) {
      for (const notifier of this.notifiers) {
        await action(notifier);
      }
    } else {
      const results = await Promise.allSettled(this.notifiers.map((notifier) => action(notifier)));
      const allFailed = results.every((result) => result.status === "rejected");
      if (allFailed) {
        const errors = results.filter((r) => r.status === "rejected").map((r) => r.reason);
        throw new Error(`All notifiers failed: ${errors.join(", ")}`);
      }
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Notifier ${index} failed:`, result.reason);
        }
      });
    }
  }
};

// src/slack-notifier.ts
var SlackNotifier = class {
  constructor(config) {
    this.enabled = false;
    this.webhookUrl = config.webhookUrl;
    try {
      this.axios = __require("axios");
      this.enabled = true;
    } catch (error) {
      console.error('Failed to initialize Slack notifier. Make sure "axios" package is installed.');
      console.error("Install with: npm install axios");
      this.enabled = false;
    }
  }
  async send(message) {
    if (!this.enabled) {
      console.warn("Slack notifier disabled - skipping notification");
      return;
    }
    try {
      await this.axios.post(this.webhookUrl, {
        text: message
      });
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      throw error;
    }
  }
  async sendAlert(alert) {
    if (!this.enabled) return;
    const emoji = this.getSeverityEmoji(alert.severity);
    const timestamp = alert.timestamp || /* @__PURE__ */ new Date();
    const color = this.getSeverityColor(alert.severity);
    const fields = [
      {
        title: "Severity",
        value: alert.severity,
        short: true
      },
      {
        title: "Time",
        value: timestamp.toISOString(),
        short: true
      }
    ];
    if (alert.metrics) {
      fields.push({
        title: "Metrics",
        value: `\`\`\`${JSON.stringify(alert.metrics, null, 2).substring(0, 500)}\`\`\``,
        short: false
      });
    }
    await this.axios.post(this.webhookUrl, {
      attachments: [
        {
          color,
          title: `${emoji} ${alert.title}`,
          text: alert.message,
          fields,
          footer: "AI Monitor",
          ts: Math.floor(timestamp.getTime() / 1e3)
        }
      ]
    });
  }
  async sendPipelineStatus(status) {
    if (!this.enabled) return;
    const emoji = this.getStatusEmoji(status.status);
    const color = this.getStatusColor(status.status);
    const fields = [
      {
        title: "Status",
        value: status.status,
        short: true
      }
    ];
    if (status.duration) {
      fields.push({
        title: "Duration",
        value: this.formatDuration(status.duration),
        short: true
      });
    }
    if (status.changes && status.changes.length > 0) {
      fields.push({
        title: "Changes",
        value: status.changes.map((c) => `\u2022 ${c}`).join("\n"),
        short: false
      });
    }
    const attachment = {
      color,
      title: `${emoji} ${status.jobName} - Build #${status.buildNumber}`,
      fields,
      footer: "AI Monitor"
    };
    if (status.url) {
      attachment.title_link = status.url;
    }
    await this.axios.post(this.webhookUrl, {
      attachments: [attachment]
    });
  }
  async sendDeploymentNotification(deployment) {
    if (!this.enabled) return;
    const emoji = deployment.status === "SUCCESS" ? "\u2705" : "\u274C";
    const color = deployment.status === "SUCCESS" ? "good" : "danger";
    const fields = [
      {
        title: "Environment",
        value: deployment.environment,
        short: true
      },
      {
        title: "Version",
        value: deployment.version,
        short: true
      },
      {
        title: "Status",
        value: deployment.status,
        short: true
      }
    ];
    if (deployment.duration) {
      fields.push({
        title: "Duration",
        value: this.formatDuration(deployment.duration),
        short: true
      });
    }
    if (deployment.changes && deployment.changes.length > 0) {
      fields.push({
        title: "Changes",
        value: deployment.changes.map((c) => `\u2022 ${c}`).join("\n"),
        short: false
      });
    }
    const attachment = {
      color,
      title: `${emoji} Deployment`,
      fields,
      footer: "AI Monitor"
    };
    if (deployment.url) {
      attachment.title_link = deployment.url;
    }
    await this.axios.post(this.webhookUrl, {
      attachments: [attachment]
    });
  }
  async sendDailyReport(report) {
    if (!this.enabled) return;
    const overallStatus = report.totalAlerts === 0 ? "\u2705 Healthy" : "\u26A0\uFE0F Issues Found";
    const color = report.totalAlerts === 0 ? "good" : "warning";
    const fields = [
      {
        title: "Total Alerts",
        value: report.totalAlerts.toString(),
        short: true
      },
      {
        title: "Critical",
        value: report.criticalAlerts.toString(),
        short: true
      },
      {
        title: "Auto-Fixed",
        value: report.autoFixes.toString(),
        short: true
      },
      {
        title: "Uptime",
        value: report.uptime,
        short: true
      }
    ];
    if (report.topIssues.length > 0) {
      fields.push({
        title: "Top Issues",
        value: report.topIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n"),
        short: false
      });
    }
    await this.axios.post(this.webhookUrl, {
      attachments: [
        {
          color,
          title: `\u{1F4CA} Daily Health Report - ${report.date.toLocaleDateString()}`,
          text: `*Overall Status:* ${overallStatus}`,
          fields,
          footer: "AI Monitor"
        }
      ]
    });
  }
  getSeverityEmoji(severity) {
    switch (severity) {
      case "CRITICAL":
        return "\u{1F6A8}";
      case "WARNING":
        return "\u26A0\uFE0F";
      case "INFO":
        return "\u2139\uFE0F";
      default:
        return "\u{1F4E2}";
    }
  }
  getSeverityColor(severity) {
    switch (severity) {
      case "CRITICAL":
        return "danger";
      case "WARNING":
        return "warning";
      case "INFO":
        return "good";
      default:
        return "#808080";
    }
  }
  getStatusEmoji(status) {
    switch (status) {
      case "SUCCESS":
        return "\u2705";
      case "FAILURE":
        return "\u274C";
      case "ABORTED":
        return "\u23F9\uFE0F";
      case "UNSTABLE":
        return "\u26A0\uFE0F";
      default:
        return "\u{1F4CB}";
    }
  }
  getStatusColor(status) {
    switch (status) {
      case "SUCCESS":
        return "good";
      case "FAILURE":
        return "danger";
      case "ABORTED":
        return "#808080";
      case "UNSTABLE":
        return "warning";
      default:
        return "#808080";
    }
  }
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
  }
};

// src/telegram-notifier.ts
var TelegramNotifier = class {
  constructor(config) {
    this.enabled = false;
    this.chatId = config.chatId;
    this.parseMode = config.parseMode || "Markdown";
    this.disableWebPagePreview = config.disableWebPagePreview ?? true;
    try {
      const { Telegram } = __require("telegram");
      this.bot = new Telegram(config.token);
      this.enabled = true;
    } catch (error) {
      console.error('Failed to initialize Telegram bot. Make sure "telegram" package is installed.');
      console.error("Install with: npm install telegram");
      this.enabled = false;
    }
  }
  async send(message) {
    if (!this.enabled) {
      console.warn("Telegram notifier disabled - skipping notification");
      return;
    }
    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: this.parseMode,
        disable_web_page_preview: this.disableWebPagePreview
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
      throw error;
    }
  }
  async sendAlert(alert) {
    if (!this.enabled) return;
    const emoji = this.getSeverityEmoji(alert.severity);
    const timestamp = alert.timestamp || /* @__PURE__ */ new Date();
    const metricsStr = alert.metrics ? `
\`metrics\`:
\`\`\`
${JSON.stringify(alert.metrics, null, 2).substring(0, 500)}
\`\`\`` : "";
    const message = `
${emoji} *${alert.severity}* - ${alert.title}

${alert.message}

*Time:* ${timestamp.toISOString()}${metricsStr}
    `.trim();
    await this.send(message);
  }
  async sendPipelineStatus(status) {
    if (!this.enabled) return;
    const emoji = this.getStatusEmoji(status.status);
    const changesStr = status.changes && status.changes.length > 0 ? `
*Changes:*
${status.changes.map((c) => `\u2022 ${c}`).join("\n")}` : "";
    const durationStr = status.duration ? `
*Duration:* ${this.formatDuration(status.duration)}` : "";
    const urlStr = status.url ? `
[View Build](${status.url})` : "";
    const message = `
${emoji} *${status.jobName}* - Build #${status.buildNumber}

*Status:* ${status.status}${durationStr}${changesStr}${urlStr}
    `.trim();
    await this.send(message);
  }
  async sendDeploymentNotification(deployment) {
    if (!this.enabled) return;
    const emoji = deployment.status === "SUCCESS" ? "\u2705" : "\u274C";
    const changesStr = deployment.changes && deployment.changes.length > 0 ? `
*Changes:*
${deployment.changes.map((c) => `\u2022 ${c}`).join("\n")}` : "";
    const durationStr = deployment.duration ? `
*Duration:* ${this.formatDuration(deployment.duration)}` : "";
    const urlStr = deployment.url ? `
[View Environment](${deployment.url})` : "";
    const message = `
${emoji} *Deployment* - ${deployment.environment}

*Version:* ${deployment.version}
*Status:* ${deployment.status}${durationStr}${changesStr}${urlStr}
    `.trim();
    await this.send(message);
  }
  async sendDailyReport(report) {
    if (!this.enabled) return;
    const message = `
\u{1F4CA} *Daily Health Report* - ${report.date.toLocaleDateString()}

*Overall Status:* ${report.totalAlerts === 0 ? "\u2705 Healthy" : "\u26A0\uFE0F Issues Found"}

\u{1F4C8} *Summary:*
\u2022 Total Alerts: ${report.totalAlerts}
\u2022 Critical: ${report.criticalAlerts}
\u2022 Auto-Fixed: ${report.autoFixes}
\u2022 Uptime: ${report.uptime}

${report.topIssues.length > 0 ? `*Top Issues:*
${report.topIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}` : ""}

_Report generated by AI Monitor_
    `.trim();
    await this.send(message);
  }
  getSeverityEmoji(severity) {
    switch (severity) {
      case "CRITICAL":
        return "\u{1F6A8}";
      case "WARNING":
        return "\u26A0\uFE0F";
      case "INFO":
        return "\u2139\uFE0F";
      default:
        return "\u{1F4E2}";
    }
  }
  getStatusEmoji(status) {
    switch (status) {
      case "SUCCESS":
        return "\u2705";
      case "FAILURE":
        return "\u274C";
      case "ABORTED":
        return "\u23F9\uFE0F";
      case "UNSTABLE":
        return "\u26A0\uFE0F";
      default:
        return "\u{1F4CB}";
    }
  }
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
  }
};

// src/webhook-notifier.ts
var WebhookNotifier = class {
  constructor(config) {
    this.config = {
      url: config.url,
      method: config.method ?? "POST",
      headers: config.headers ?? { "Content-Type": "application/json" },
      retries: config.retries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1e3
    };
    try {
      this.axios = __require("axios");
    } catch {
      throw new Error("WebhookNotifier requires axios. Install with: npm install axios");
    }
  }
  async send(message) {
    await this.post({ type: "message", message, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  }
  async sendAlert(alert) {
    await this.post({
      type: "alert",
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metrics: alert.metrics,
      timestamp: alert.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async sendPipelineStatus(status) {
    await this.post({ type: "pipeline", ...status });
  }
  async sendDeploymentNotification(deployment) {
    await this.post({ type: "deployment", ...deployment });
  }
  async sendDailyReport(report) {
    await this.post({
      type: "daily_report",
      ...report,
      date: report.date.toISOString()
    });
  }
  /**
   * POST with exponential backoff retry.
   */
  async post(payload) {
    let lastError;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        await this.axios({
          method: this.config.method,
          url: this.config.url,
          headers: this.config.headers,
          data: payload
        });
        return;
      } catch (error) {
        lastError = error;
        if (attempt < this.config.retries) {
          const delay = this.config.retryDelayMs * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }
};
export {
  DiscordNotifier,
  EmailNotifier,
  MultiNotifier,
  SlackNotifier,
  TelegramNotifier,
  WebhookNotifier
};
