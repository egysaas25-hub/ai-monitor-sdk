import type { IInstrumentationConfig } from './types';

/**
 * Error interceptor
 * Automatically captures all uncaught errors and unhandled promise rejections
 */
export class ErrorInterceptor {
  private config: Required<IInstrumentationConfig>;
  private originalUncaughtException: any;
  private originalUnhandledRejection: any;

  constructor(config: Required<IInstrumentationConfig>) {
    this.config = config;
  }

  /**
   * Start intercepting errors
   */
  start(): void {
    if (!this.config.captureErrors) {
      return;
    }

    // Intercept uncaught exceptions
    this.originalUncaughtException = process.listeners('uncaughtException');
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', async (error: Error) => {
      await this.handleError(error, 'uncaughtException');

      // Call original handlers
      this.originalUncaughtException.forEach((handler: any) => {
        try {
          handler(error);
        } catch (e) {
          // Ignore handler errors
        }
      });
    });

    // Intercept unhandled promise rejections
    this.originalUnhandledRejection = process.listeners('unhandledRejection');
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await this.handleError(error, 'unhandledRejection');

      // Call original handlers
      this.originalUnhandledRejection.forEach((handler: any) => {
        try {
          handler(reason, promise);
        } catch (e) {
          // Ignore handler errors
        }
      });
    });
  }

  /**
   * Stop intercepting
   */
  stop(): void {
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    // Restore original handlers
    if (this.originalUncaughtException) {
      this.originalUncaughtException.forEach((handler: any) => {
        process.on('uncaughtException', handler);
      });
    }

    if (this.originalUnhandledRejection) {
      this.originalUnhandledRejection.forEach((handler: any) => {
        process.on('unhandledRejection', handler);
      });
    }
  }

  /**
   * Handle an error
   */
  private async handleError(error: Error, type: string): Promise<void> {
    try {
      // Apply error filter if configured
      if (this.config.errorFilter && !this.config.errorFilter(error)) {
        return;
      }

      await this.config.monitor.alert({
        severity: 'CRITICAL',
        title: `${type}: ${error.name}`,
        message: error.message,
        metrics: {
          errorType: type,
          errorName: error.name,
          stack: error.stack,
          appName: this.config.appName,
          environment: this.config.environment,
        },
      });
    } catch (alertError) {
      console.error('Failed to send error alert:', alertError);
    }
  }

  /**
   * Manually capture an error
   */
  async captureError(error: Error, context?: Record<string, any>): Promise<void> {
    if (!this.config.captureErrors) {
      return;
    }

    if (this.config.errorFilter && !this.config.errorFilter(error)) {
      return;
    }

    await this.config.monitor.alert({
      severity: 'CRITICAL',
      title: `Error: ${error.name}`,
      message: error.message,
      metrics: {
        errorName: error.name,
        stack: error.stack,
        context,
        appName: this.config.appName,
        environment: this.config.environment,
      },
    });
  }
}
