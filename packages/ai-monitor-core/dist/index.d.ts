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

/**
 * Health Check Probes
 *
 * Active polling of external dependencies (DB, Redis, APIs).
 * Fires alerts on failure and recovery — transforming the SDK
 * from reactive alerting to proactive monitoring.
 */
interface IProbeConfig {
    /** Unique probe name (e.g. 'postgres', 'redis', 'stripe-api') */
    name: string;
    /** Probe type */
    type: 'http' | 'tcp' | 'custom';
    /** Polling interval in ms (default: 30_000 = 30s) */
    intervalMs?: number;
    /** Timeout per check in ms (default: 5_000 = 5s) */
    timeoutMs?: number;
    /** URL to probe (required for type: 'http') */
    url?: string;
    /** Expected HTTP status code (default: 200) */
    expectedStatus?: number;
    /** HTTP method (default: 'GET') */
    method?: string;
    /** Host for TCP check (required for type: 'tcp') */
    host?: string;
    /** Port for TCP check (required for type: 'tcp') */
    port?: number;
    /** Custom check function (required for type: 'custom') */
    check?: () => Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
interface IProbeResult {
    name: string;
    healthy: boolean;
    lastCheck: Date;
    lastError?: string;
    consecutiveFailures: number;
    responseTimeMs?: number;
}
type AlertFn = (alert: IAlert) => Promise<void>;
declare class HealthProbeManager {
    private probes;
    private results;
    private intervals;
    private alertFn;
    private logger;
    constructor(alertFn: AlertFn, logger?: ILogger);
    /**
     * Add an HTTP health probe.
     */
    addHttpProbe(name: string, url: string, opts?: Partial<IProbeConfig>): this;
    /**
     * Add a TCP connectivity probe.
     */
    addTcpProbe(name: string, host: string, port: number, opts?: Partial<IProbeConfig>): this;
    /**
     * Add a custom probe with an async check function.
     */
    addCustomProbe(name: string, check: () => Promise<{
        healthy: boolean;
        message?: string;
    }>, opts?: Partial<IProbeConfig>): this;
    /**
     * Start polling all probes.
     */
    start(): void;
    /**
     * Stop all probes.
     */
    stop(): void;
    /**
     * Get current status of all probes.
     */
    getStatus(): Record<string, IProbeResult>;
    /**
     * Run a single probe check.
     */
    private runProbe;
    /**
     * HTTP health check — uses native fetch (Node 18+).
     */
    private checkHttp;
    /**
     * TCP connectivity check using Node.js net module.
     */
    private checkTcp;
}

/**
 * Plugin System for AI Monitor
 *
 * Provides lifecycle hooks so external code can extend
 * the monitor without modifying core internals.
 *
 * Usage:
 *   monitor.use({ name: 'my-plugin', onAlert: (a) => { ... return a; } });
 */
interface IAIMonitorRef {
    alert(alert: IAlert): Promise<void>;
    notify(message: string): Promise<void>;
}
interface IPlugin {
    /** Unique name for this plugin */
    name: string;
    /** Called when the plugin is registered via monitor.use() */
    onInit?(monitor: IAIMonitorRef): void | Promise<void>;
    /** Called when the monitor starts */
    onStart?(monitor: IAIMonitorRef): void | Promise<void>;
    /** Called when the monitor stops */
    onStop?(monitor: IAIMonitorRef): void | Promise<void>;
    /**
     * Called before an alert is sent. Can mutate or replace the alert.
     * Return the (possibly modified) alert to continue, or null to suppress it.
     */
    onAlert?(alert: IAlert, monitor: IAIMonitorRef): IAlert | null | Promise<IAlert | null>;
    /**
     * Called just before notifiers fire. Return false to suppress notification.
     */
    onBeforeNotify?(alert: IAlert): boolean | Promise<boolean>;
}
declare class PluginManager {
    private plugins;
    /**
     * Register a plugin and call its onInit hook.
     */
    register(plugin: IPlugin, monitor: IAIMonitorRef): Promise<void>;
    /**
     * Run a named lifecycle hook across all plugins.
     */
    runHook(hook: 'onStart' | 'onStop', monitor: IAIMonitorRef): Promise<void>;
    /**
     * Run the alert pipeline: onAlert → onBeforeNotify.
     * Returns the final alert, or null if any plugin suppressed it.
     */
    processAlert(alert: IAlert, monitor: IAIMonitorRef): Promise<IAlert | null>;
    /**
     * Retrieve a plugin by name.
     */
    getPlugin(name: string): IPlugin | undefined;
    /**
     * Number of registered plugins.
     */
    get count(): number;
}

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
interface IConfigBuilderOptions {
    fromEnv?: boolean;
    envPrefix?: string;
}

/**
 * Alert Deduplication & Cooldown
 *
 * Prevents notification storms by suppressing duplicate alerts
 * within a configurable cooldown window. Uses a hash of
 * severity + title as the dedup key.
 */
interface IDeduplicationConfig {
    /** Enable deduplication (default: true) */
    enabled?: boolean;
    /** Cooldown window in ms — same alert won't fire again within this period (default: 300_000 = 5 min) */
    cooldownMs?: number;
}
declare class AlertDeduplicator {
    private entries;
    private readonly cooldownMs;
    constructor(config?: IDeduplicationConfig);
    /**
     * Compute a fingerprint for an alert based on severity + title.
     */
    private fingerprint;
    /**
     * Check whether this alert should be sent.
     * Returns true if the alert has NOT been sent within the cooldown window.
     */
    shouldSend(alert: IAlert): boolean;
    /**
     * Number of alerts suppressed since last reset.
     */
    get suppressedCount(): number;
    /**
     * Reset all dedup state.
     */
    reset(): void;
    /**
     * Reset a specific key by severity + title.
     */
    resetKey(severity: string, title: string): void;
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
     * Configure alert deduplication
     */
    deduplication(enabled?: boolean, cooldownMs?: number): this;
    /**
     * Add a plugin
     */
    addPlugin(plugin: any): this;
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
 * Configuration Validator
 *
 * Validates IMonitorConfig at construction time so users get
 * clear, actionable error messages instead of cryptic runtime crashes.
 */
interface IValidationResult {
    valid: boolean;
    errors: string[];
}
declare function validateConfig(config: IMonitorConfig): IValidationResult;

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
    private deduplicator;
    private pluginManager;
    private probeManager;
    constructor(config?: IMonitorConfig);
    /**
     * Register a plugin at runtime.
     */
    use(plugin: IPlugin): Promise<this>;
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

export { AIMonitor, AIService, AlertDeduplicator, type AlertSeverity, ConfigBuilder, ConsoleLogger, type DeploymentStatus, HealthProbeManager, type IAIAnalysis, type IAIConfig, type IAIMonitorRef, type IAIService, type IAlert, type IConfigBuilderOptions, type IDailyReport, type IDeduplicationConfig, type IDeployment, type ILogEntry, type ILogger, type IMetricData, type IMonitorConfig, type INotifier, type IPipelineStatus, type IPlugin, type IProbeConfig, type IProbeResult, type PipelineStatus, PluginManager, WinstonLoggerAdapter, createConfig, validateConfig };
