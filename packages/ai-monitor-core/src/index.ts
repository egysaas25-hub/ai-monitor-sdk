/**
 * @aker/ai-monitor-core
 * 
 * Plug-and-play AI monitoring for any Node.js application
 * Drop it in, configure, and start monitoring with AI-powered insights
 */

// Export types
export type {
  ILogger,
  INotifier,
  IMonitorConfig,
  IAlert,
  IPipelineStatus,
  IDeployment,
  IDailyReport,
  AlertSeverity,
  PipelineStatus,
  DeploymentStatus,
  IConfigBuilderOptions
} from './types';

// Export AI types
export type {
  IAIConfig,
  IAIAnalysis,
  IAIService,
  ILogEntry,
  IMetricData
} from './ai-types';

// Export core classes
export { AIMonitor } from './monitor';
export { ConfigBuilder, createConfig } from './config-builder';
export { ConsoleLogger, WinstonLoggerAdapter } from './logger-adapter';

// Export AI service
export { AIService } from './ai-service';
