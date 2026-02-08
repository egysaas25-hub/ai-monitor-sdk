import type { IncomingMessage, ServerResponse } from 'node:http';
import type { IHttpMetric, IInstrumentationConfig } from './types';

/**
 * HTTP interceptor
 * Automatically monitors all HTTP requests and responses
 */
export class HttpInterceptor {
  private config: Required<IInstrumentationConfig>;

  constructor(config: Required<IInstrumentationConfig>) {
    this.config = config;
  }

  /**
   * Create Express/Connect middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      if (!this.config.captureHttp) {
        return next();
      }

      const startTime = Date.now();
      const originalEnd = res.end;
      const self = this;

      // Override res.end to capture metrics
      res.end = (...args: any[]) => {
        const duration = Date.now() - startTime;

        const metric: IHttpMetric = {
          method: req.method,
          url: req.url || req.originalUrl,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
        };

        // Send metric asynchronously (don't block response)
        setImmediate(async () => {
          await self.handleHttpMetric(metric);
        });

        // Call original end
        return originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Wrap Node.js http.Server
   */
  wrapHttpServer(server: any): void {
    if (!this.config.captureHttp) {
      return;
    }

    const originalEmit = server.emit;

    server.emit = (event: string, ...args: any[]) => {
      if (event === 'request') {
        const req = args[0] as IncomingMessage;
        const res = args[1] as ServerResponse;
        const startTime = Date.now();

        const originalEnd = res.end;
        res.end = (...endArgs: any[]) => {
          const duration = Date.now() - startTime;

          const metric: IHttpMetric = {
            method: req.method || 'UNKNOWN',
            url: req.url || '/',
            statusCode: res.statusCode,
            duration,
            timestamp: new Date(),
          };

          setImmediate(async () => {
            await this.handleHttpMetric(metric);
          });

          return originalEnd.apply(res, endArgs as any);
        };
      }

      return originalEmit.apply(server, [event, ...args]);
    };
  }

  /**
   * Handle HTTP metric
   */
  private async handleHttpMetric(metric: IHttpMetric): Promise<void> {
    try {
      // Alert on slow requests
      if (metric.duration > this.config.performanceThreshold) {
        await this.config.monitor.alert({
          severity: 'WARNING',
          title: 'Slow HTTP Request',
          message: `${metric.method} ${metric.url} took ${metric.duration}ms`,
          metrics: {
            ...metric,
            threshold: this.config.performanceThreshold,
            appName: this.config.appName,
            environment: this.config.environment,
          },
        });
      }

      // Alert on errors (5xx status codes)
      if (metric.statusCode && metric.statusCode >= 500) {
        await this.config.monitor.alert({
          severity: 'CRITICAL',
          title: 'HTTP Server Error',
          message: `${metric.method} ${metric.url} returned ${metric.statusCode}`,
          metrics: {
            ...metric,
            appName: this.config.appName,
            environment: this.config.environment,
          },
        });
      }

      // Alert on client errors (4xx status codes) if repeated
      if (metric.statusCode && metric.statusCode >= 400 && metric.statusCode < 500) {
        // Could implement rate limiting here to avoid spam
        // For now, just log
        console.debug(`HTTP ${metric.statusCode}: ${metric.method} ${metric.url}`);
      }
    } catch (error) {
      console.error('Failed to handle HTTP metric:', error);
    }
  }

  /**
   * Track outgoing HTTP requests (fetch, axios, etc.)
   */
  trackOutgoingRequest(
    url: string,
    options?: { method?: string },
  ): {
    end: (statusCode?: number, error?: Error) => Promise<void>;
  } {
    const startTime = Date.now();
    const method = options?.method || 'GET';

    return {
      end: async (statusCode?: number, error?: Error) => {
        const duration = Date.now() - startTime;

        const metric: IHttpMetric = {
          method,
          url,
          statusCode,
          duration,
          timestamp: new Date(),
          error: error?.message,
        };

        await this.handleHttpMetric(metric);
      },
    };
  }
}
