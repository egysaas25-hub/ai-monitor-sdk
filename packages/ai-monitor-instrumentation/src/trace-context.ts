/**
 * Distributed Tracing — W3C Trace Context
 *
 * Follows the W3C Trace Context spec (traceparent header).
 * Uses Node.js AsyncLocalStorage for zero-dependency context propagation.
 *
 * Format: 00-{traceId}-{spanId}-{flags}
 *   traceId: 32 hex chars
 *   spanId:  16 hex chars
 *   flags:   2 hex chars (01 = sampled)
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';

export interface ITraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

// Shared async-local storage for trace context propagation
const traceStorage = new AsyncLocalStorage<ITraceContext>();

export class TraceContext {
  /**
   * Generate a random 32-hex-char trace ID.
   */
  static generateTraceId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Generate a random 16-hex-char span ID.
   */
  static generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Create a W3C traceparent header value.
   */
  static createTraceparent(ctx: ITraceContext): string {
    const flags = ctx.sampled ? '01' : '00';
    return `00-${ctx.traceId}-${ctx.spanId}-${flags}`;
  }

  /**
   * Parse a W3C traceparent header into a trace context.
   * Returns null if the header is invalid.
   */
  static parseTraceparent(header: string): ITraceContext | null {
    const parts = header.split('-');
    if (parts.length !== 4) return null;

    const [version, traceId, spanId, flags] = parts;
    if (version !== '00') return null;
    if (traceId.length !== 32 || !/^[0-9a-f]+$/.test(traceId)) return null;
    if (spanId.length !== 16 || !/^[0-9a-f]+$/.test(spanId)) return null;

    return {
      traceId,
      spanId,
      sampled: flags === '01',
    };
  }

  /**
   * Get the current trace context from AsyncLocalStorage.
   */
  static current(): ITraceContext | undefined {
    return traceStorage.getStore();
  }

  /**
   * Get the current trace ID, or undefined if no active trace.
   */
  static currentTraceId(): string | undefined {
    return traceStorage.getStore()?.traceId;
  }

  /**
   * Run a function within a trace context.
   */
  static run<T>(ctx: ITraceContext, fn: () => T): T {
    return traceStorage.run(ctx, fn);
  }

  /**
   * Create a new child span from the current context.
   */
  static createChildSpan(): ITraceContext | null {
    const parent = traceStorage.getStore();
    if (!parent) return null;

    return {
      traceId: parent.traceId,
      spanId: TraceContext.generateSpanId(),
      parentSpanId: parent.spanId,
      sampled: parent.sampled,
    };
  }
}

/**
 * Express/Connect middleware for automatic trace context propagation.
 *
 * - Reads incoming `traceparent` header (or generates a new trace)
 * - Stores context in AsyncLocalStorage (accessible via TraceContext.current())
 * - Sets `traceparent` on the outgoing response header
 */
export function traceMiddleware() {
  return (req: any, res: any, next: any) => {
    let ctx: ITraceContext;

    const incomingHeader = req.headers?.traceparent;
    if (incomingHeader) {
      const parsed = TraceContext.parseTraceparent(incomingHeader);
      if (parsed) {
        // Create a new span under the incoming trace
        ctx = {
          traceId: parsed.traceId,
          spanId: TraceContext.generateSpanId(),
          parentSpanId: parsed.spanId,
          sampled: parsed.sampled,
        };
      } else {
        // Invalid header — start a fresh trace
        ctx = {
          traceId: TraceContext.generateTraceId(),
          spanId: TraceContext.generateSpanId(),
          sampled: true,
        };
      }
    } else {
      // No incoming header — start a fresh trace
      ctx = {
        traceId: TraceContext.generateTraceId(),
        spanId: TraceContext.generateSpanId(),
        sampled: true,
      };
    }

    // Set response header
    res.setHeader('traceparent', TraceContext.createTraceparent(ctx));

    // Attach to request for easy access
    req.traceContext = ctx;
    req.traceId = ctx.traceId;

    // Run the rest of the middleware chain inside the trace context
    TraceContext.run(ctx, () => next());
  };
}
