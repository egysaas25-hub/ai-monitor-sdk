/**
 * Core type definitions for AI Monitor
 * These interfaces define the contracts for plug-and-play architecture
 */
/**
 * Logger interface - implement this to use your own logger
 */
interface ILogger {
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
}
/**
 * Notifier interface - implement this to create custom notification channels
 */
interface INotifier {
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
type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
/**
 * Alert structure
 */
interface IAlert {
    severity: AlertSeverity;
    title: string;
    message: string;
    metrics?: Record<string, any>;
    timestamp?: Date;
}
/**
 * Pipeline status types
 */
type PipelineStatus = 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE';
/**
 * Pipeline status structure
 */
interface IPipelineStatus {
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
type DeploymentStatus = 'SUCCESS' | 'FAILURE';
/**
 * Deployment structure
 */
interface IDeployment {
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
interface IDailyReport {
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
interface IMonitorConfig {
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
}
/**
 * Configuration builder options
 */
interface IConfigBuilderOptions {
    fromEnv?: boolean;
    envPrefix?: string;
}

/**
 * AI Analysis types
 */
interface IAIConfig {
    /**
     * AI provider API key (OpenAI, Anthropic, etc.)
     */
    apiKey?: string;
    /**
     * AI API endpoint
     */
    apiUrl?: string;
    /**
     * AI model to use
     */
    model?: string;
    /**
     * Enable AI analysis
     */
    enabled?: boolean;
    /**
     * AI analysis features
     */
    features?: {
        anomalyDetection?: boolean;
        rootCauseAnalysis?: boolean;
        autoHealing?: boolean;
        patternRecognition?: boolean;
    };
}
/**
 * AI Analysis result
 */
interface IAIAnalysis {
    /**
     * Detected severity level
     */
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    /**
     * AI-generated summary
     */
    summary: string;
    /**
     * Root cause analysis
     */
    rootCause?: string;
    /**
     * Suggested fixes
     */
    suggestions?: string[];
    /**
     * Is this an anomaly?
     */
    isAnomaly?: boolean;
    /**
     * Confidence score (0-1)
     */
    confidence?: number;
    /**
     * Related patterns found
     */
    relatedPatterns?: string[];
    /**
     * Auto-healing command (if applicable)
     */
    autoHealCommand?: string;
}
/**
 * Log entry for AI analysis
 */
interface ILogEntry {
    timestamp: Date;
    level: string;
    message: string;
    context?: string;
    stack?: string;
    metadata?: Record<string, any>;
}
/**
 * Metric data for AI analysis
 */
interface IMetricData {
    name: string;
    value: number;
    timestamp: Date;
    unit?: string;
    tags?: Record<string, string>;
}
/**
 * AI Service interface
 */
interface IAIService {
    /**
     * Analyze a log entry
     */
    analyzeLog(log: ILogEntry): Promise<IAIAnalysis>;
    /**
     * Analyze multiple logs for patterns
     */
    analyzeLogs(logs: ILogEntry[]): Promise<IAIAnalysis>;
    /**
     * Analyze metrics for anomalies
     */
    analyzeMetrics(metrics: IMetricData[]): Promise<IAIAnalysis>;
    /**
     * Analyze an error and suggest fixes
     */
    analyzeError(error: Error, context?: Record<string, any>): Promise<IAIAnalysis>;
    /**
     * Detect anomalies in data
     */
    detectAnomalies(data: any[]): Promise<IAIAnalysis>;
    /**
     * Get auto-healing suggestion
     */
    suggestAutoHeal(issue: string, context?: Record<string, any>): Promise<IAIAnalysis>;
}

/**
 * Core AI Monitor class
 * Plug-and-play monitoring for any Node.js application
 */
declare class AIMonitor {
    private config;
    private notifiers;
    private logger;
    private server;
    private isRunning;
    private aiService;
    constructor(config?: IMonitorConfig);
    /**
     * Start the monitoring server
     */
    start(): Promise<void>;
    /**
     * Stop the monitoring server
     */
    stop(): Promise<void>;
    /**
     * Send an alert through all configured notifiers
     * If AI is enabled, the alert is analyzed first for severity and insights
     */
    alert(alert: IAlert): Promise<void>;
    /**
     * Send pipeline status notification
     */
    pipelineStatus(status: IPipelineStatus): Promise<void>;
    /**
     * Send deployment notification
     */
    deployment(deployment: IDeployment): Promise<void>;
    /**
     * Send daily report
     */
    dailyReport(report: IDailyReport): Promise<void>;
    /**
     * Send a raw message through all notifiers
     */
    notify(message: string): Promise<void>;
    /**
     * Handle incoming HTTP requests
     */
    private handleRequest;
    /**
     * Handle health check endpoint
     */
    private handleHealthCheck;
    /**
     * Handle alert endpoint
     */
    private handleAlertEndpoint;
    /**
     * Handle pipeline endpoint
     */
    private handlePipelineEndpoint;
    /**
     * Send test notification
     */
    private sendTestNotification;
    /**
     * Helper to notify all notifiers
     */
    private notifyAll;
}

/**
 * Fluent configuration builder for AIMonitor
 * Makes setup intuitive and discoverable
 */
declare class ConfigBuilder {
    private config;
    constructor(options?: IConfigBuilderOptions);
    /**
     * Set the server host
     */
    host(host: string): this;
    /**
     * Set the server port
     */
    port(port: number): this;
    /**
     * Enable or disable monitoring
     */
    enabled(enabled: boolean): this;
    /**
     * Add a notifier
     */
    addNotifier(notifier: any): this;
    /**
     * Set notifiers (replaces existing)
     */
    notifiers(notifiers: any | any[]): this;
    /**
     * Set custom logger
     */
    logger(logger: any): this;
    /**
     * Enable health endpoint
     */
    enableHealthEndpoint(enable?: boolean): this;
    /**
     * Enable alert endpoint
     */
    enableAlertEndpoint(enable?: boolean): this;
    /**
     * Enable pipeline endpoint
     */
    enablePipelineEndpoint(enable?: boolean): this;
    /**
     * Send test notification on startup
     */
    sendTestNotification(send?: boolean, delay?: number): this;
    /**
     * Build the configuration
     */
    build(): IMonitorConfig;
    /**
     * Load configuration from environment variables
     */
    private loadFromEnv;
}
/**
 * Create a new configuration builder
 */
declare function createConfig(options?: IConfigBuilderOptions): ConfigBuilder;

/**
 * Default console logger implementation
 * Used when no custom logger is provided
 */
declare class ConsoleLogger implements ILogger {
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
}
/**
 * Winston logger adapter
 * Adapts winston logger to ILogger interface
 */
declare class WinstonLoggerAdapter implements ILogger {
    private winstonLogger;
    constructor(winstonLogger: any);
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
}

/**
 * AI-powered monitoring service
 * Uses LLMs to analyze logs, detect anomalies, and provide intelligent insights
 */
declare class AIService implements IAIService {
    private config;
    private axios;
    private enabled;
    constructor(config?: IAIConfig);
    analyzeLog(log: ILogEntry): Promise<IAIAnalysis>;
    analyzeLogs(logs: ILogEntry[]): Promise<IAIAnalysis>;
    analyzeMetrics(metrics: IMetricData[]): Promise<IAIAnalysis>;
    analyzeError(error: Error, context?: Record<string, any>): Promise<IAIAnalysis>;
    detectAnomalies(data: any[]): Promise<IAIAnalysis>;
    suggestAutoHeal(issue: string, context?: Record<string, any>): Promise<IAIAnalysis>;
    /**
     * Core AI analysis method
     */
    private analyze;
    /**
     * Build prompts for different analysis types
     */
    private buildLogAnalysisPrompt;
    private buildLogsAnalysisPrompt;
    private buildMetricsAnalysisPrompt;
    private buildErrorAnalysisPrompt;
    private buildAnomalyDetectionPrompt;
    private buildAutoHealPrompt;
    /**
     * System prompt for AI
     */
    private getSystemPrompt;
    /**
     * Parse AI response into structured format
     */
    private parseAIResponse;
    /**
     * Fallback analysis when AI is disabled
     */
    private getFallbackAnalysis;
}

export { AIMonitor, AIService, type AlertSeverity, ConfigBuilder, ConsoleLogger, type DeploymentStatus, type IAIAnalysis, type IAIConfig, type IAIService, type IAlert, type IConfigBuilderOptions, type IDailyReport, type IDeployment, type ILogEntry, type ILogger, type IMetricData, type IMonitorConfig, type INotifier, type IPipelineStatus, type PipelineStatus, WinstonLoggerAdapter, createConfig };
