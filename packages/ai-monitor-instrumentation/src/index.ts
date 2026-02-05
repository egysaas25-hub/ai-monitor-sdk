/**
 * @aker/ai-monitor-instrumentation
 * 
 * Plug-and-play auto-instrumentation for any Node.js application
 * Just start it and your app is automatically monitored!
 */

// Export types
export type {
  IInstrumentationConfig,
  IPerformanceMetric,
  IHttpMetric,
  ISystemMetrics,
  IThresholds
} from './types';

// Export main class
export { Instrumentation } from './instrumentation';

// Export individual components for advanced usage
export { SystemMetricsCollector } from './system-metrics';
export { ErrorInterceptor } from './error-interceptor';
export { PerformanceMonitor } from './performance-monitor';
export { HttpInterceptor } from './http-interceptor';
export { MetricAggregator } from './metric-aggregator';
export { PrometheusExporter } from './prometheus-exporter';
export { ExternalResourceMonitor } from './resource-monitor';
