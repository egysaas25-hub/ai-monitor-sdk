import type { IInstrumentationConfig, IPerformanceMetric } from './types';

/**
 * Performance monitor
 * Tracks operation performance and alerts on slow operations
 */
export class PerformanceMonitor {
  private config: Required<IInstrumentationConfig>;
  private measurements: Map<string, number> = new Map();

  constructor(config: Required<IInstrumentationConfig>) {
    this.config = config;
  }

  /**
   * Start measuring an operation
   */
  startMeasure(operationName: string): void {
    if (!this.config.capturePerformance) {
      return;
    }

    this.measurements.set(operationName, Date.now());
  }

  /**
   * End measurement and alert if slow
   */
  async endMeasure(operationName: string, context?: Record<string, any>): Promise<IPerformanceMetric | null> {
    if (!this.config.capturePerformance) {
      return null;
    }

    const startTime = this.measurements.get(operationName);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationName}`);
      return null;
    }

    const duration = Date.now() - startTime;
    this.measurements.delete(operationName);

    const metric: IPerformanceMetric = {
      operation: operationName,
      duration,
      timestamp: new Date(),
      context
    };

    // Alert if duration exceeds threshold
    if (duration > this.config.performanceThreshold) {
      await this.config.monitor.alert({
        severity: 'WARNING',
        title: 'Slow Operation Detected',
        message: `Operation "${operationName}" took ${duration}ms (threshold: ${this.config.performanceThreshold}ms)`,
        metrics: {
          ...metric,
          threshold: this.config.performanceThreshold,
          appName: this.config.appName,
          environment: this.config.environment
        }
      });
    }

    return metric;
  }

  /**
   * Measure a function execution
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T> | T,
    context?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(operationName);

    try {
      const result = await fn();
      await this.endMeasure(operationName, context);
      return result;
    } catch (error) {
      await this.endMeasure(operationName, { ...context, error: true });
      throw error;
    }
  }

  /**
   * Create a decorator for methods
   */
  measureDecorator(operationName?: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const opName = operationName || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = async function (...args: any[]) {
        return this.measure(opName, () => originalMethod.apply(this, args));
      };

      return descriptor;
    };
  }
}
