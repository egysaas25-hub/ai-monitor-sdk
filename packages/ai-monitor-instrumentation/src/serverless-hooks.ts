import type { ILogger } from '@momen124/ai-monitor-core';
import { ConsoleLogger } from '@momen124/ai-monitor-core';

/**
 * Serverless invocation metrics.
 */
export interface IServerlessMetrics {
  coldStarts: number;
  warmInvocations: number;
  totalInvocations: number;
  avgColdStartMs: number;
  avgWarmMs: number;
}

/**
 * ServerlessLifecycle provides lifecycle hooks for
 * Lambda / Cloud Functions / Azure Functions environments.
 * Tracks cold-start vs warm invocation metrics.
 */
export class ServerlessLifecycle {
  private isCold = true;
  private coldStarts = 0;
  private warmInvocations = 0;
  private totalColdStartMs = 0;
  private totalWarmMs = 0;
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private logger: ILogger;

  constructor(opts?: { logger?: ILogger }) {
    this.logger = opts?.logger ?? new ConsoleLogger();
  }

  /** Call at the start of each invocation. Returns cold-start indicator. */
  onInvocationStart(): { isColdStart: boolean; startTime: number } {
    const isColdStart = this.isCold;
    if (isColdStart) {
      this.coldStarts++;
      this.isCold = false;
      this.logger.info('❄️ Cold start detected');
    } else {
      this.warmInvocations++;
    }
    return { isColdStart, startTime: Date.now() };
  }

  /** Call at the end of each invocation with the context from onInvocationStart. */
  onInvocationEnd(ctx: { isColdStart: boolean; startTime: number }): void {
    const durationMs = Date.now() - ctx.startTime;
    if (ctx.isColdStart) {
      this.totalColdStartMs += durationMs;
    } else {
      this.totalWarmMs += durationMs;
    }
  }

  /** Register a shutdown handler (e.g. flush buffers, close connections). */
  onShutdown(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /** Execute all registered shutdown handlers. */
  async executeShutdown(): Promise<void> {
    this.logger.info('🛑 Executing serverless shutdown handlers');
    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (err: any) {
        this.logger.error(`Shutdown handler error: ${err.message}`);
      }
    }
  }

  /**
   * Wrap a serverless handler function with lifecycle instrumentation.
   * Works with AWS Lambda style `(event, context) => Promise<result>` handlers.
   */
  wrapHandler<TEvent, TResult>(
    fn: (event: TEvent) => Promise<TResult>,
  ): (event: TEvent) => Promise<TResult> {
    return async (event: TEvent): Promise<TResult> => {
      const ctx = this.onInvocationStart();
      try {
        const result = await fn(event);
        this.onInvocationEnd(ctx);
        return result;
      } catch (err) {
        this.onInvocationEnd(ctx);
        throw err;
      }
    };
  }

  /** Get current serverless lifecycle metrics. */
  getMetrics(): IServerlessMetrics {
    const total = this.coldStarts + this.warmInvocations;
    return {
      coldStarts: this.coldStarts,
      warmInvocations: this.warmInvocations,
      totalInvocations: total,
      avgColdStartMs: this.coldStarts > 0 ? this.totalColdStartMs / this.coldStarts : 0,
      avgWarmMs: this.warmInvocations > 0 ? this.totalWarmMs / this.warmInvocations : 0,
    };
  }
}
