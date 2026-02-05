import type { AIMonitor } from '@aker/ai-monitor-core';
import type { IInstrumentationConfig } from './types';
import { SystemMetricsCollector } from './system-metrics';
import { ErrorInterceptor } from './error-interceptor';
import { PerformanceMonitor } from './performance-monitor';
import { HttpInterceptor } from './http-interceptor';
import { MetricAggregator } from './metric-aggregator';
import { PrometheusExporter } from './prometheus-exporter';
import { ExternalResourceMonitor } from './resource-monitor';

export class Instrumentation {
  private config: Required<IInstrumentationConfig>;
  private systemMetrics: SystemMetricsCollector;
  private errorInterceptor: ErrorInterceptor;
  private performanceMonitor: PerformanceMonitor;
  private httpInterceptor: HttpInterceptor;
  private metricAggregator: MetricAggregator;
  private prometheusExporter: PrometheusExporter;
  private resourceMonitor: ExternalResourceMonitor;
  private isRunning: boolean = false;

  constructor(config: IInstrumentationConfig) {
    this.config = {
      monitor: config.monitor,
      enablePrometheus: config.enablePrometheus ?? true,
      thresholds: config.thresholds,
      captureErrors: config.captureErrors ?? true,
      capturePerformance: config.capturePerformance ?? true,
      captureHttp: config.captureHttp ?? true,
      captureDatabase: config.captureDatabase ?? true,
      captureSystemMetrics: config.captureSystemMetrics ?? true,
      systemMetricsInterval: config.systemMetricsInterval ?? 60000,
      appName: config.appName ?? 'unknown',
      environment: config.environment ?? process.env.NODE_ENV ?? 'development',
      errorFilter: config.errorFilter
    } as Required<IInstrumentationConfig>;

    // Initialize all collectors
    this.systemMetrics = new SystemMetricsCollector(this.config);
    this.errorInterceptor = new ErrorInterceptor(this.config);
    this.performanceMonitor = new PerformanceMonitor(this.config);
    this.httpInterceptor = new HttpInterceptor(this.config);
    this.metricAggregator = new MetricAggregator(this.config);
    this.prometheusExporter = new PrometheusExporter();
    this.resourceMonitor = new ExternalResourceMonitor(this.config);
  }

  start(): void {
    if (this.isRunning) return;
    console.log('🔍 Starting auto-instrumentation with Golden Signals...');

    this.systemMetrics.start();
    this.errorInterceptor.start();
    this.metricAggregator.start();
    this.resourceMonitor.start();

    this.isRunning = true;
    console.log('✅ Golden Signals Monitoring Active');
  }

  stop(): void {
    if (!this.isRunning) return;
    this.systemMetrics.stop();
    this.errorInterceptor.stop();
    this.metricAggregator.stop();
    this.resourceMonitor.stop();
    this.isRunning = false;
  }

  /**
   * Register custom resource checks
   */
  monitorDbConnection(fn: () => Promise<number> | number): void {
    this.resourceMonitor.registerDbConnectionCheck(fn);
  }

  monitorQueueLength(fn: () => Promise<number> | number): void {
    this.resourceMonitor.registerQueueCheck(fn);
  }

  /**
   * Get Express/Connect middleware
   * Now also records metric data for aggregation
   */
  httpMiddleware() {
    const baseMiddleware = this.httpInterceptor.middleware();
    return async (req: any, res: any, next: any) => {
      // 1. Prometheus /metrics endpoint
      if (this.config.enablePrometheus && req.path === '/metrics') {
        return this.prometheusExporter.handleRequest(req, res);
      }

      // 2. Wrap next to capture timing for Aggregator
      const start = Date.now();
      const originalEnd = res.end;
      
      res.end = (...args: any[]) => {
        const duration = Date.now() - start;
        const isError = res.statusCode >= 500;
        
        // Feed Aggregator (P95, Error Rate)
        this.metricAggregator.recordRequest(duration, isError);
        
        // Feed Prometheus
        this.prometheusExporter.observe('http_request_duration_seconds', duration / 1000, { method: req.method, path: req.path });
        this.prometheusExporter.observe('http_requests_total', 1, { method: req.method, status: res.statusCode.toString() });

        return originalEnd.apply(res, args);
      };

      // 3. Call original interceptor logic (logging etc)
      return baseMiddleware(req, res, next);
    };
  }

  /**
   * Wrap an HTTP server
   */
  wrapHttpServer(server: any): void {
    this.httpInterceptor.wrapHttpServer(server);
  }

  /**
   * Measure a function's performance
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T> | T,
    context?: Record<string, any>
  ): Promise<T> {
    return this.performanceMonitor.measure(operationName, fn, context);
  }

  /**
   * Start measuring an operation
   */
  startMeasure(operationName: string): void {
    this.performanceMonitor.startMeasure(operationName);
  }

  /**
   * End measurement
   */
  async endMeasure(operationName: string, context?: Record<string, any>): Promise<void> {
    await this.performanceMonitor.endMeasure(operationName, context);
  }

  /**
   * Manually capture an error
   */
  async captureError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.errorInterceptor.captureError(error, context);
  }

  /**
   * Track an outgoing HTTP request
   */
  trackHttpRequest(url: string, options?: { method?: string }) {
    return this.httpInterceptor.trackOutgoingRequest(url, options);
  }

  /**
   * Get performance monitor (for decorators)
   */
  get performance(): PerformanceMonitor {
    return this.performanceMonitor;
  }
}
