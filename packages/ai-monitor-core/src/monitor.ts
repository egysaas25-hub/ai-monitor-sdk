import type {
  IMonitorConfig,
  INotifier,
  ILogger,
  IAlert,
  IPipelineStatus,
  IDeployment,
  IDailyReport
} from './types';
import { ConsoleLogger } from './logger-adapter';
import { createServer, IncomingMessage, ServerResponse } from 'http';

/**
 * Core AI Monitor class
 * Plug-and-play monitoring for any Node.js application
 */
export class AIMonitor {
  private config: Required<IMonitorConfig>;
  private notifiers: INotifier[];
  private logger: ILogger;
  private server: any;
  private isRunning: boolean = false;
  private aiService: any = null; // IAIService type from ai-service.ts

  constructor(config: IMonitorConfig = {}) {
    // Try to load AI service if AI config is provided
    if (config.aiConfig?.enabled && config.aiConfig?.apiKey) {
      try {
        const { AIService } = require('./ai-service');
        this.aiService = new AIService(config.aiConfig);
        console.log('🤖 AI-powered analysis enabled');
      } catch (error) {
        console.warn('AI Service unavailable. Install axios for AI features: npm install axios');
      }
    }

    // Set defaults
    this.config = {
      host: config.host ?? '0.0.0.0',
      port: config.port ?? 3333,
      enabled: config.enabled ?? true,
      notifiers: config.notifiers ?? [],
      logger: config.logger ?? new ConsoleLogger(),
      aiConfig: config.aiConfig,
      enableAIEnhancedAlerts: config.enableAIEnhancedAlerts ?? (this.aiService !== null),
      enableHealthEndpoint: config.enableHealthEndpoint ?? true,
      enableAlertEndpoint: config.enableAlertEndpoint ?? true,
      enablePipelineEndpoint: config.enablePipelineEndpoint ?? true,
      sendTestNotification: config.sendTestNotification ?? false,
      testNotificationDelay: config.testNotificationDelay ?? 3000
    } as Required<IMonitorConfig>;

    // Normalize notifiers to array
    this.notifiers = Array.isArray(this.config.notifiers)
      ? this.config.notifiers
      :this.config.notifiers
      ? [this.config.notifiers]
      : [];

    this.logger = this.config.logger;

    // Create HTTP server
    this.server = createServer((req, res) => this.handleRequest(req, res));

    if (!this.config.enabled) {
      this.logger.warn('⚠️  AI Monitor is disabled.');
    }
  }

  /**
   * Start the monitoring server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Monitor is already running');
      return;
    }

    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;

        if (this.config.enabled) {
          this.logger.info(
            `🚀 AI Monitor started on http://${this.config.host}:${this.config.port}`
          );
          this.logger.info(`📊 Health check: http://${this.config.host}:${this.config.port}/health`);
          this.logger.info(`📢 Notifiers: ${this.notifiers.length} configured`);
          this.logger.info(`✅ AI Monitoring is ENABLED`);
        } else {
          this.logger.info(
            `🚀 AI Monitor started on http://${this.config.host}:${this.config.port} (DISABLED MODE)`
          );
          this.logger.info(`⚠️  AI Monitoring is DISABLED`);
        }

        // Send test notification if enabled
        if (this.config.sendTestNotification && this.config.enabled) {
          setTimeout(() => {
            this.sendTestNotification();
          }, this.config.testNotificationDelay);
        }

        resolve();
      });
    });
  }

  /**
   * Stop the monitoring server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server.close((err: Error) => {
        if (err) {
          this.logger.error('Error stopping server:', err);
          reject(err);
        } else {
          this.isRunning = false;
          this.logger.info('AI Monitor stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Send an alert through all configured notifiers
   * If AI is enabled, the alert is analyzed first for severity and insights
   */
  async alert(alert: IAlert): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('Monitor disabled, skipping alert');
      return;
    }

    let enhancedAlert = {
      ...alert,
      timestamp: alert.timestamp || new Date()
    };

    // Use AI to enhance the alert if enabled
    if (this.aiService && this.config.enableAIEnhancedAlerts) {
      try {
        const analysis = await this.aiService.analyzeLog({
          timestamp: enhancedAlert.timestamp,
          level: enhancedAlert.severity,
          message: enhancedAlert.message,
          metadata: enhancedAlert.metrics
        });

        // Enhance the alert with AI insights
        enhancedAlert = {
          ...enhancedAlert,
          message: `${enhancedAlert.message}\n\n🤖 AI Analysis:\n${analysis.summary}${
            analysis.rootCause ? `\n\n**Root Cause:** ${analysis.rootCause}` : ''
          }${
            analysis.suggestions && analysis.suggestions.length > 0
              ? `\n\n**Suggestions:**\n${analysis.suggestions.map((s: string) => `• ${s}`).join('\n')}`
              : ''
          }`,
          metrics: {
            ...enhancedAlert.metrics,
            aiAnalysis: analysis
          }
        };

        this.logger.info(`🤖 AI Enhanced: [${alert.severity}] ${alert.title} (Confidence: ${Math.round((analysis.confidence || 0) * 100)}%)`);
      } catch (error) {
        this.logger.warn('AI analysis failed, sending original alert:', error);
      }
    }

    this.logger.info(`📢 Alert: [${enhancedAlert.severity}] ${enhancedAlert.title}`);

    await this.notifyAll(async (notifier) => {
      await notifier.sendAlert(enhancedAlert);
    });
  }

  /**
   * Send pipeline status notification
   */
  async pipelineStatus(status: IPipelineStatus): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('Monitor disabled, skipping pipeline status');
      return;
    }

    this.logger.info(`🔧 Pipeline: ${status.jobName} - ${status.status}`);

    await this.notifyAll(async (notifier) => {
      await notifier.sendPipelineStatus(status);
    });
  }

  /**
   * Send deployment notification
   */
  async deployment(deployment: IDeployment): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('Monitor disabled, skipping deployment notification');
      return;
    }

    this.logger.info(`🚀 Deployment: ${deployment.environment} - ${deployment.status}`);

    await this.notifyAll(async (notifier) => {
      await notifier.sendDeploymentNotification(deployment);
    });
  }

  /**
   * Send daily report
   */
  async dailyReport(report: IDailyReport): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('Monitor disabled, skipping daily report');
      return;
    }

    this.logger.info(`📊 Daily Report: ${report.totalAlerts} alerts`);

    await this.notifyAll(async (notifier) => {
      await notifier.sendDailyReport(report);
    });
  }

  /**
   * Send a raw message through all notifiers
   */
  async notify(message: string): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('Monitor disabled, skipping notification');
      return;
    }

    await this.notifyAll(async (notifier) => {
      await notifier.send(message);
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const { method, url } = req;

    // Health endpoint
    if (method === 'GET' && url === '/health' && this.config.enableHealthEndpoint) {
      this.handleHealthCheck(res);
      return;
    }

    // Alert endpoint
    if (method === 'POST' && url === '/alert' && this.config.enableAlertEndpoint) {
      this.handleAlertEndpoint(req, res);
      return;
    }

    // Pipeline endpoint
    if (method === 'POST' && url === '/pipeline' && this.config.enablePipelineEndpoint) {
      this.handlePipelineEndpoint(req, res);
      return;
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  /**
   * Handle health check endpoint
   */
  private handleHealthCheck(res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        enabled: this.config.enabled,
        notifiers: this.notifiers.length,
        timestamp: new Date().toISOString()
      })
    );
  }

  /**
   * Handle alert endpoint
   */
  private handleAlertEndpoint(req: IncomingMessage, res: ServerResponse): void {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const alert = JSON.parse(body) as IAlert;
        await this.alert(alert);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        this.logger.error('Error processing alert:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to process alert' }));
      }
    });
  }

  /**
   * Handle pipeline endpoint
   */
  private handlePipelineEndpoint(req: IncomingMessage, res: ServerResponse): void {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const status = JSON.parse(body) as IPipelineStatus;
        await this.pipelineStatus(status);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        this.logger.error('Error processing pipeline status:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to process pipeline status' }));
      }
    });
  }

  /**
   * Send test notification
   */
  private async sendTestNotification(): Promise<void> {
    this.logger.info('Sending test notification...');
    try {
      await this.notify('🚀 AI Monitor is running!\n\nMonitoring active and ready to receive alerts.');
      this.logger.info('Test notification sent successfully');
    } catch (error) {
      this.logger.error('Failed to send test notification:', error);
    }
  }

  /**
   * Helper to notify all notifiers
   */
  private async notifyAll(action: (notifier: INotifier) => Promise<void>): Promise<void> {
    if (this.notifiers.length === 0) {
      this.logger.warn('No notifiers configured');
      return;
    }

    const results = await Promise.allSettled(
      this.notifiers.map((notifier) => action(notifier))
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(`Notifier ${index} failed:`, result.reason);
      }
    });
  }
}
