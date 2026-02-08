import { ConsoleLogger } from './logger-adapter';
import type { IAlert, ILogger } from './types';

/**
 * Health Check Probes
 *
 * Active polling of external dependencies (DB, Redis, APIs).
 * Fires alerts on failure and recovery — transforming the SDK
 * from reactive alerting to proactive monitoring.
 */

export interface IProbeConfig {
  /** Unique probe name (e.g. 'postgres', 'redis', 'stripe-api') */
  name: string;
  /** Probe type */
  type: 'http' | 'tcp' | 'custom';
  /** Polling interval in ms (default: 30_000 = 30s) */
  intervalMs?: number;
  /** Timeout per check in ms (default: 5_000 = 5s) */
  timeoutMs?: number;

  // HTTP probe options
  /** URL to probe (required for type: 'http') */
  url?: string;
  /** Expected HTTP status code (default: 200) */
  expectedStatus?: number;
  /** HTTP method (default: 'GET') */
  method?: string;

  // TCP probe options
  /** Host for TCP check (required for type: 'tcp') */
  host?: string;
  /** Port for TCP check (required for type: 'tcp') */
  port?: number;

  // Custom probe options
  /** Custom check function (required for type: 'custom') */
  check?: () => Promise<{ healthy: boolean; message?: string }>;
}

export interface IProbeResult {
  name: string;
  healthy: boolean;
  lastCheck: Date;
  lastError?: string;
  consecutiveFailures: number;
  responseTimeMs?: number;
}

type AlertFn = (alert: IAlert) => Promise<void>;

export class HealthProbeManager {
  private probes = new Map<string, IProbeConfig>();
  private results = new Map<string, IProbeResult>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private alertFn: AlertFn;
  private logger: ILogger;

  constructor(alertFn: AlertFn, logger?: ILogger) {
    this.alertFn = alertFn;
    this.logger = logger ?? new ConsoleLogger();
  }

  /**
   * Add an HTTP health probe.
   */
  addHttpProbe(name: string, url: string, opts?: Partial<IProbeConfig>): this {
    this.probes.set(name, { name, type: 'http', url, ...opts });
    return this;
  }

  /**
   * Add a TCP connectivity probe.
   */
  addTcpProbe(name: string, host: string, port: number, opts?: Partial<IProbeConfig>): this {
    this.probes.set(name, { name, type: 'tcp', host, port, ...opts });
    return this;
  }

  /**
   * Add a custom probe with an async check function.
   */
  addCustomProbe(
    name: string,
    check: () => Promise<{ healthy: boolean; message?: string }>,
    opts?: Partial<IProbeConfig>,
  ): this {
    this.probes.set(name, { name, type: 'custom', check, ...opts });
    return this;
  }

  /**
   * Start polling all probes.
   */
  start(): void {
    for (const [name, probeConfig] of this.probes) {
      const intervalMs = probeConfig.intervalMs ?? 30_000;

      // Initialize result
      this.results.set(name, {
        name,
        healthy: true, // Assume healthy until proven otherwise
        lastCheck: new Date(),
        consecutiveFailures: 0,
      });

      // Schedule polling
      const interval = setInterval(() => {
        this.runProbe(probeConfig).catch((err) => {
          this.logger.error(`Probe ${name} runner error:`, err);
        });
      }, intervalMs);

      this.intervals.set(name, interval);

      // Run immediately on start
      this.runProbe(probeConfig).catch((err) => {
        this.logger.error(`Probe ${name} initial check error:`, err);
      });

      this.logger.info(`🏥 Health probe '${name}' started (every ${intervalMs / 1000}s)`);
    }
  }

  /**
   * Stop all probes.
   */
  stop(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      this.logger.debug(`Probe '${name}' stopped`);
    }
    this.intervals.clear();
  }

  /**
   * Get current status of all probes.
   */
  getStatus(): Record<string, IProbeResult> {
    const status: Record<string, IProbeResult> = {};
    for (const [name, result] of this.results) {
      status[name] = { ...result };
    }
    return status;
  }

  /**
   * Run a single probe check.
   */
  private async runProbe(config: IProbeConfig): Promise<void> {
    const result = this.results.get(config.name)!;
    const wasHealthy = result.healthy;
    const start = Date.now();

    try {
      let probeResult: { healthy: boolean; message?: string };

      switch (config.type) {
        case 'http':
          probeResult = await this.checkHttp(config);
          break;
        case 'tcp':
          probeResult = await this.checkTcp(config);
          break;
        case 'custom':
          probeResult = config.check ? await config.check() : { healthy: false, message: 'No check function' };
          break;
        default:
          probeResult = { healthy: false, message: `Unknown probe type: ${config.type}` };
      }

      result.responseTimeMs = Date.now() - start;
      result.lastCheck = new Date();

      if (probeResult.healthy) {
        // Recovery — was down, now back up
        if (!wasHealthy) {
          result.consecutiveFailures = 0;
          result.healthy = true;
          result.lastError = undefined;
          await this.alertFn({
            severity: 'INFO',
            title: `✅ ${config.name} recovered`,
            message: `Health probe '${config.name}' is back online (${result.responseTimeMs}ms)`,
            timestamp: new Date(),
          });
        }
        result.healthy = true;
        result.consecutiveFailures = 0;
        result.lastError = undefined;
      } else {
        // Failure
        result.healthy = false;
        result.consecutiveFailures++;
        result.lastError = probeResult.message || 'Check failed';

        const severity = result.consecutiveFailures >= 3 ? 'CRITICAL' : 'WARNING';
        await this.alertFn({
          severity,
          title: `🔴 ${config.name} is down`,
          message: `Health probe '${config.name}' failed: ${result.lastError} (${result.consecutiveFailures} consecutive failures)`,
          metrics: { responseTimeMs: result.responseTimeMs, consecutiveFailures: result.consecutiveFailures },
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      result.responseTimeMs = Date.now() - start;
      result.lastCheck = new Date();
      result.healthy = false;
      result.consecutiveFailures++;
      result.lastError = error.message || 'Unknown error';

      const severity = result.consecutiveFailures >= 3 ? 'CRITICAL' : 'WARNING';
      await this.alertFn({
        severity,
        title: `🔴 ${config.name} is down`,
        message: `Health probe '${config.name}' error: ${result.lastError} (${result.consecutiveFailures} consecutive failures)`,
        metrics: { responseTimeMs: result.responseTimeMs, consecutiveFailures: result.consecutiveFailures },
        timestamp: new Date(),
      });
    }
  }

  /**
   * HTTP health check — uses native fetch (Node 18+).
   */
  private async checkHttp(config: IProbeConfig): Promise<{ healthy: boolean; message?: string }> {
    const url = config.url!;
    const expectedStatus = config.expectedStatus ?? 200;
    const timeoutMs = config.timeoutMs ?? 5_000;
    const method = config.method ?? 'GET';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { method, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === expectedStatus) {
        return { healthy: true };
      }
      return { healthy: false, message: `Expected status ${expectedStatus}, got ${res.status}` };
    } catch (error: any) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        return { healthy: false, message: `Timeout after ${timeoutMs}ms` };
      }
      return { healthy: false, message: error.message };
    }
  }

  /**
   * TCP connectivity check using Node.js net module.
   */
  private async checkTcp(config: IProbeConfig): Promise<{ healthy: boolean; message?: string }> {
    const { host, port, timeoutMs = 5_000 } = config;

    return new Promise((resolve) => {
      try {
        const net = require('net');
        const socket = new net.Socket();

        const timer = setTimeout(() => {
          socket.destroy();
          resolve({ healthy: false, message: `TCP timeout after ${timeoutMs}ms` });
        }, timeoutMs);

        socket.connect(port!, host!, () => {
          clearTimeout(timer);
          socket.destroy();
          resolve({ healthy: true });
        });

        socket.on('error', (err: Error) => {
          clearTimeout(timer);
          socket.destroy();
          resolve({ healthy: false, message: err.message });
        });
      } catch (error: any) {
        resolve({ healthy: false, message: error.message });
      }
    });
  }
}
