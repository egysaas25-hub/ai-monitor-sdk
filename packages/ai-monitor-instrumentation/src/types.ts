import type { AIMonitor } from '@aker/ai-monitor-core';

/**
 * Golden Signal Thresholds
 * Based on SRE best practices
 */
export interface IThresholds {
  /**
   * Response Time P95 in ms
   * Warning: 200-500ms, Critical: >500ms
   */
  responseTime?: {
    warning: number;
    critical: number;
  };

  /**
   * Error Rate percentage (0-100)
   * Warning: 0.1-1%, Critical: >1%
   */
  errorRate?: {
    warning: number;
    critical: number;
  };

  /**
   * CPU Usage percentage (0-1)
   * Warning: 50-70%, Critical: >70%
   */
  cpu?: {
    warning: number;
    critical: number;
  };

  /**
   * Memory Usage percentage (0-1)
   * Warning: 60-80%, Critical: >80%
   */
  memory?: {
    warning: number;
    critical: number;
  };

  /**
   * DB Connection Usage percentage (0-1)
   * Warning: 50-80%, Critical: >80%
   */
  dbConnections?: {
    warning: number;
    critical: number;
  };

  /**
   * Queue Length count
   * Warning: 100-1000, Critical: >1000
   */
  queueLength?: {
    warning: number;
    critical: number;
  };
}

/**
 * Instrumentation configuration
 */
export interface IInstrumentationConfig {
  /**
   * Monitor instance to send metrics to
   */
  monitor: AIMonitor;

  /**
   * Enable Prometheus metrics endpoint (default: true)
   * Exposed at /metrics
   */
  enablePrometheus?: boolean;

  /**
   * Custom thresholds (defaults to industry standards)
   */
  thresholds?: IThresholds;

  /**
   * Enable error monitoring (default: true)
   */
  captureErrors?: boolean;

  /**
   * Enable performance monitoring (default: true)
   */
  capturePerformance?: boolean;

  /**
   * Enable HTTP request/response monitoring (default: true)
   */
  captureHttp?: boolean;

  /**
   * Enable database query monitoring (default: true)
   */
  captureDatabase?: boolean;

  /**
   * Enable system metrics (CPU, memory) (default: true)
   */
  captureSystemMetrics?: boolean;

  /**
   * System metrics interval in ms (default: 60000 = 1 minute)
   */
  systemMetricsInterval?: number;

  /**
   * Custom error filter
   * Return false to ignore the error
   */
  errorFilter?: (error: Error) => boolean;

  /**
   * Application name for context
   */
  appName?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Performance threshold in ms (default: 500)
   * Operations exceeding this duration trigger WARNING alerts
   */
  performanceThreshold?: number;
}

/**
 * Performance metric
 */
export interface IPerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * HTTP metric
 */
export interface IHttpMetric {
  method: string;
  url: string;
  statusCode?: number;
  duration: number;
  timestamp: Date;
  error?: string;
}

/**
 * System metrics
 */
export interface ISystemMetrics {
  cpu: {
    usage: number; // percentage
    average: number;
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    percentage: number;
  };
  uptime: number; // seconds
  timestamp: Date;
}
