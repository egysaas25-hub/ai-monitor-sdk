/**
 * Core type definitions for AI Monitor
 * These interfaces define the contracts for plug-and-play architecture
 */

import type { IDeduplicationConfig } from './alert-deduplicator';
import type { IProbeConfig } from './health-probes';
import type { IPlugin } from './plugin';

/**
 * Logger interface - implement this to use your own logger
 */
export interface ILogger {
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
}

/**
 * Notifier interface - implement this to create custom notification channels
 */
export interface INotifier {
  /**
   * Send a raw message
   */
  send(message: string): Promise<void>;

  /**
   * Send a structured alert
   */
  sendAlert(alert: IAlert): Promise<void>;

  /**
   * Send pipeline status notification
   */
  sendPipelineStatus(status: IPipelineStatus): Promise<void>;

  /**
   * Send deployment notification
   */
  sendDeploymentNotification(deployment: IDeployment): Promise<void>;

  /**
   * Send daily report
   */
  sendDailyReport(report: IDailyReport): Promise<void>;
}

/**
 * Alert severity levels
 */
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * Alert structure
 */
export interface IAlert {
  severity: AlertSeverity;
  title: string;
  message: string;
  metrics?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Pipeline status types
 */
export type PipelineStatus = 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE';

/**
 * Pipeline status structure
 */
export interface IPipelineStatus {
  jobName: string;
  buildNumber: string;
  status: PipelineStatus;
  duration?: number;
  url?: string;
  changes?: string[];
}

/**
 * Deployment status types
 */
export type DeploymentStatus = 'SUCCESS' | 'FAILURE';

/**
 * Deployment structure
 */
export interface IDeployment {
  environment: string;
  version: string;
  status: DeploymentStatus;
  duration?: number;
  url?: string;
  changes?: string[];
}

/**
 * Daily report structure
 */
export interface IDailyReport {
  date: Date;
  totalAlerts: number;
  criticalAlerts: number;
  autoFixes: number;
  uptime: string;
  topIssues: string[];
}

/**
 * Monitor configuration
 */
export interface IMonitorConfig {
  /**
   * Server host (default: '0.0.0.0')
   */
  host?: string;

  /**
   * Server port (default: 3333)
   */
  port?: number;

  /**
   * Enable the monitor (default: true)
   * Set to false to disable all monitoring functionality
   */
  enabled?: boolean;

  /**
   * Notifiers to use for alerts
   * Can be a single notifier or an array of notifiers
   */
  notifiers?: INotifier | INotifier[];

  /**
   * Custom logger implementation
   * If not provided, uses console logger
   */
  logger?: ILogger;

  /**
   * AI configuration for intelligent analysis
   * Enables anomaly detection, root cause analysis, and auto-healing suggestions
   */
  aiConfig?: {
    /**
     * AI API key (OpenAI, Anthropic, etc.)
     */
    apiKey?: string;

    /**
     * AI API endpoint
     */
    apiUrl?: string;

    /**
     * AI model to use (e.g., 'gpt-4o-mini')
     */
    model?: string;

    /**
     * Enable AI analysis
     */
    enabled?: boolean;

    /**
     * AI features to enable
     */
    features?: {
      anomalyDetection?: boolean;
      rootCauseAnalysis?: boolean;
      autoHealing?: boolean;
      patternRecognition?: boolean;
    };
  };

  /**
   * Enable AI-enhanced alerts (default: true if AI is configured)
   * When enabled, alerts are analyzed by AI before being sent
   */
  enableAIEnhancedAlerts?: boolean;

  /**
   * Enable health endpoint (default: true)
   */
  enableHealthEndpoint?: boolean;

  /**
   * Enable alert endpoint (default: true)
   */
  enableAlertEndpoint?: boolean;

  /**
   * Enable pipeline endpoint (default: true)
   */
  enablePipelineEndpoint?: boolean;

  /**
   * Send test notification on startup (default: false)
   */
  sendTestNotification?: boolean;

  /**
   * Test notification delay in ms (default: 3000)
   */
  testNotificationDelay?: number;

  /**
   * Alert deduplication config — prevents notification storms
   */
  deduplication?: IDeduplicationConfig;

  /**
   * Plugins for extending monitor behavior
   */
  plugins?: IPlugin[];

  /**
   * Health check probes for active dependency monitoring
   */
  probes?: IProbeConfig[];
}

/**
 * Configuration builder options
 */
export interface IConfigBuilderOptions {
  fromEnv?: boolean;
  envPrefix?: string;
}
