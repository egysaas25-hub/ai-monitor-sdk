/**
 * @aker/ai-monitor-instrumentation
 *
 * Plug-and-play auto-instrumentation for any Node.js application
 * Just start it and your app is automatically monitored!
 */

export { ErrorInterceptor } from './error-interceptor';
export { HttpInterceptor } from './http-interceptor';
// Export main class
export { Instrumentation } from './instrumentation';
export type { ILogEntry, ILogQueryOptions } from './log-aggregator';
// Export log aggregation
export { LogAggregator } from './log-aggregator';
export { MetricAggregator } from './metric-aggregator';
export { PerformanceMonitor } from './performance-monitor';
export { PrometheusExporter } from './prometheus-exporter';
export { ExternalResourceMonitor } from './resource-monitor';
// Export individual components for advanced usage
export { SystemMetricsCollector } from './system-metrics';
export type { ITraceContext } from './trace-context';
// Export tracing
export { TraceContext, traceMiddleware } from './trace-context';
// Export types
export type {
  IHttpMetric,
  IInstrumentationConfig,
  IPerformanceMetric,
  ISystemMetrics,
  IThresholds,
} from './types';
