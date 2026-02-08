import { INotifier, IAlert, IPipelineStatus, IDeployment, IDailyReport } from '@aker/ai-monitor-core';

/**
 * Discord Notifier
 *
 * Sends notifications to Discord via Webhook with rich embeds.
 */
interface IDiscordConfig {
    /** Discord Webhook URL */
    webhookUrl: string;
    /** Bot username override (optional) */
    username?: string;
    /** Bot avatar URL override (optional) */
    avatarUrl?: string;
}
declare class DiscordNotifier implements INotifier {
    private config;
    private axios;
    constructor(config: IDiscordConfig);
    send(message: string): Promise<void>;
    sendAlert(alert: IAlert): Promise<void>;
    sendPipelineStatus(status: IPipelineStatus): Promise<void>;
    sendDeploymentNotification(deployment: IDeployment): Promise<void>;
    sendDailyReport(report: IDailyReport): Promise<void>;
    private post;
}

/**
 * Email notifier configuration
 */
interface IEmailConfig {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
    to: string | string[];
}
/**
 * Email notifier implementation
 * Sends notifications via SMTP
 */
declare class EmailNotifier implements INotifier {
    private config;
    private transporter;
    private enabled;
    constructor(config: IEmailConfig);
    send(message: string): Promise<void>;
    sendAlert(alert: IAlert): Promise<void>;
    sendPipelineStatus(status: IPipelineStatus): Promise<void>;
    sendDeploymentNotification(deployment: IDeployment): Promise<void>;
    sendDailyReport(report: IDailyReport): Promise<void>;
    private generateAlertHtml;
    private generateAlertText;
    private generatePipelineHtml;
    private generatePipelineText;
    private generateDeploymentHtml;
    private generateDeploymentText;
    private generateReportHtml;
    private generateReportText;
    private getSeverityColor;
    private getStatusColor;
    private formatDuration;
}

/**
 * Multi-notifier configuration
 */
interface IMultiNotifierConfig {
    notifiers: INotifier[];
    stopOnFirstError?: boolean;
}
/**
 * Multi-notifier implementation
 * Sends notifications to multiple notifiers using the composite pattern
 * Handles partial failures gracefully
 */
declare class MultiNotifier implements INotifier {
    private notifiers;
    private stopOnFirstError;
    constructor(config: IMultiNotifierConfig);
    send(message: string): Promise<void>;
    sendAlert(alert: IAlert): Promise<void>;
    sendPipelineStatus(status: IPipelineStatus): Promise<void>;
    sendDeploymentNotification(deployment: IDeployment): Promise<void>;
    sendDailyReport(report: IDailyReport): Promise<void>;
    /**
     * Execute action on all notifiers
     * Handles partial failures based on stopOnFirstError setting
     */
    private executeOnAll;
}

/**
 * Slack notifier configuration
 */
interface ISlackConfig {
    webhookUrl: string;
}
/**
 * Slack notifier implementation
 * Sends notifications to Slack via webhook
 */
declare class SlackNotifier implements INotifier {
    private webhookUrl;
    private axios;
    private enabled;
    constructor(config: ISlackConfig);
    send(message: string): Promise<void>;
    sendAlert(alert: IAlert): Promise<void>;
    sendPipelineStatus(status: IPipelineStatus): Promise<void>;
    sendDeploymentNotification(deployment: IDeployment): Promise<void>;
    sendDailyReport(report: IDailyReport): Promise<void>;
    private getSeverityEmoji;
    private getSeverityColor;
    private getStatusEmoji;
    private getStatusColor;
    private formatDuration;
}

/**
 * Telegram notifier configuration
 */
interface ITelegramConfig {
    token: string;
    chatId: string;
    parseMode?: 'Markdown' | 'HTML';
    disableWebPagePreview?: boolean;
}
/**
 * Telegram notifier implementation
 * Sends notifications to Telegram via bot API
 */
declare class TelegramNotifier implements INotifier {
    private bot;
    private chatId;
    private parseMode;
    private disableWebPagePreview;
    private enabled;
    constructor(config: ITelegramConfig);
    send(message: string): Promise<void>;
    sendAlert(alert: IAlert): Promise<void>;
    sendPipelineStatus(status: IPipelineStatus): Promise<void>;
    sendDeploymentNotification(deployment: IDeployment): Promise<void>;
    sendDailyReport(report: IDailyReport): Promise<void>;
    private getSeverityEmoji;
    private getStatusEmoji;
    private formatDuration;
}

/**
 * Webhook Notifier
 *
 * Generic HTTP notifier — POST JSON to any URL.
 * Works with PagerDuty, Opsgenie, custom dashboards,
 * or any webhook consumer.
 */
interface IWebhookConfig {
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
declare class WebhookNotifier implements INotifier {
    private config;
    private axios;
    constructor(config: IWebhookConfig);
    send(message: string): Promise<void>;
    sendAlert(alert: IAlert): Promise<void>;
    sendPipelineStatus(status: IPipelineStatus): Promise<void>;
    sendDeploymentNotification(deployment: IDeployment): Promise<void>;
    sendDailyReport(report: IDailyReport): Promise<void>;
    /**
     * POST with exponential backoff retry.
     */
    private post;
}

export { DiscordNotifier, EmailNotifier, type IDiscordConfig, type IEmailConfig, type IMultiNotifierConfig, type ISlackConfig, type ITelegramConfig, type IWebhookConfig, MultiNotifier, SlackNotifier, TelegramNotifier, WebhookNotifier };
