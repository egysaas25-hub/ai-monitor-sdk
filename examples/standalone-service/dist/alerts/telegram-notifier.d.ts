export declare class TelegramNotifier {
    private bot;
    private chatId;
    private enabled;
    constructor();
    send(message: string): Promise<void>;
    sendAlert(alert: {
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        title: string;
        message: string;
        metrics?: any;
        timestamp?: Date;
    }): Promise<void>;
    sendPipelineStatus(status: {
        jobName: string;
        buildNumber: string;
        status: 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE';
        duration?: number;
        url?: string;
        changes?: string[];
    }): Promise<void>;
    sendDeploymentNotification(deployment: {
        environment: string;
        version: string;
        status: 'SUCCESS' | 'FAILURE';
        duration?: number;
        url?: string;
        changes?: string[];
    }): Promise<void>;
    sendDailyReport(report: {
        date: Date;
        totalAlerts: number;
        criticalAlerts: number;
        autoFixes: number;
        uptime: string;
        topIssues: string[];
    }): Promise<void>;
    private formatAlertMessage;
    private formatPipelineMessage;
    private formatDeploymentMessage;
    private formatDailyReport;
    private getSeverityEmoji;
    private getStatusEmoji;
    private formatDuration;
}
//# sourceMappingURL=telegram-notifier.d.ts.map