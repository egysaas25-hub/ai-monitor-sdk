/**
 * Log Aggregator
 *
 * Captures, stores, and queries application logs in a ring buffer.
 * Provides console interception and a queryable in-memory log store.
 */

export interface ILogEntry {
  level: string;
  message: string;
  timestamp: Date;
  meta?: Record<string, any>;
}

export interface ILogQueryOptions {
  /** Filter by log level(s) */
  levels?: string[];
  /** Only logs after this date */
  since?: Date;
  /** Only logs before this date */
  until?: Date;
  /** Search pattern (substring match) */
  search?: string;
  /** Max results to return (default: 100) */
  limit?: number;
}

export class LogAggregator {
  private buffer: ILogEntry[] = [];
  private maxEntries: number;
  private originalConsole: Record<string, (...args: any[]) => void> = {};
  private intercepting = false;

  constructor(maxEntries: number = 10_000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Manually capture a log entry.
   */
  capture(level: string, message: string, meta?: Record<string, any>): void {
    this.push({ level, message, timestamp: new Date(), meta });
  }

  /**
   * Monkey-patch console.log/warn/error/debug to auto-capture logs.
   * Original console methods are preserved and still called.
   */
  interceptConsole(): void {
    if (this.intercepting) return;
    this.intercepting = true;

    const methods = ['log', 'warn', 'error', 'debug'] as const;
    const levelMap: Record<string, string> = { log: 'info', warn: 'warn', error: 'error', debug: 'debug' };

    for (const method of methods) {
      this.originalConsole[method] = console[method];
      console[method] = (...args: any[]) => {
        // Capture the log
        const message = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        this.capture(levelMap[method], message);

        // Call original
        this.originalConsole[method](...args);
      };
    }
  }

  /**
   * Restore original console methods.
   */
  restoreConsole(): void {
    if (!this.intercepting) return;
    this.intercepting = false;

    for (const [method, original] of Object.entries(this.originalConsole)) {
      (console as any)[method] = original;
    }
    this.originalConsole = {};
  }

  /**
   * Query logs with optional filters.
   */
  query(opts: ILogQueryOptions = {}): ILogEntry[] {
    let results = [...this.buffer];

    if (opts.levels && opts.levels.length > 0) {
      const levels = new Set(opts.levels.map((l) => l.toLowerCase()));
      results = results.filter((e) => levels.has(e.level.toLowerCase()));
    }

    if (opts.since) {
      const since = opts.since.getTime();
      results = results.filter((e) => e.timestamp.getTime() >= since);
    }

    if (opts.until) {
      const until = opts.until.getTime();
      results = results.filter((e) => e.timestamp.getTime() <= until);
    }

    if (opts.search) {
      const pattern = opts.search.toLowerCase();
      results = results.filter((e) => e.message.toLowerCase().includes(pattern));
    }

    const limit = opts.limit ?? 100;
    return results.slice(-limit);
  }

  /**
   * Shorthand: get recent error logs.
   */
  getRecentErrors(limit: number = 50): ILogEntry[] {
    return this.query({ levels: ['error'], limit });
  }

  /**
   * Clear all buffered logs.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Current buffer size.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Serializable snapshot of the buffer.
   */
  toJSON(): ILogEntry[] {
    return [...this.buffer];
  }

  /**
   * Push to ring buffer — drops oldest entries when full.
   */
  private push(entry: ILogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.shift();
    }
  }
}
