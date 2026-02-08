/**
 * @aker/ai-monitor-core
 *
 * Plug-and-play AI monitoring for any Node.js application
 * Drop it in, configure, and start monitoring with AI-powered insights
 */

// Export AI service
export { AIService } from './ai-service';

// Export AI types
export type {
  IAIAnalysis,
  IAIConfig,
  IAIService,
  ILogEntry,
  IMetricData,
} from './ai-types';
export type { IDeduplicationConfig } from './alert-deduplicator';
// Export enhancement modules
export { AlertDeduplicator } from './alert-deduplicator';
export { ConfigBuilder, createConfig } from './config-builder';
export { validateConfig } from './config-validator';
export type { IProbeConfig, IProbeResult } from './health-probes';
export { HealthProbeManager } from './health-probes';
export { ConsoleLogger, WinstonLoggerAdapter } from './logger-adapter';
// Export core classes
export { AIMonitor } from './monitor';
export type { IAIMonitorRef, IPlugin } from './plugin';
export { PluginManager } from './plugin';
// Export types
export type {
  AlertSeverity,
  DeploymentStatus,
  IAlert,
  IConfigBuilderOptions,
  IDailyReport,
  IDeployment,
  ILogger,
  IMonitorConfig,
  INotifier,
  IPipelineStatus,
  PipelineStatus,
} from './types';
