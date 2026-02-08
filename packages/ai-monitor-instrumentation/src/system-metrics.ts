import * as os from 'os';
import type { IInstrumentationConfig, ISystemMetrics } from './types';

/**
 * System metrics collector
 * Monitors CPU, memory, uptime automatically
 */
export class SystemMetricsCollector {
  private config: Required<IInstrumentationConfig>;
  private intervalId: any = null;
  private previousCpuUsage: NodeJS.CpuUsage | null = null;

  constructor(config: Required<IInstrumentationConfig>) {
    this.config = config;
  }

  /**
   * Start collecting system metrics
   */
  start(): void {
    if (!this.config.captureSystemMetrics) {
      return;
    }

    // Collect immediately
    this.collect();

    // Then collect on interval
    this.intervalId = setInterval(() => {
      this.collect();
    }, this.config.systemMetricsInterval);
  }

  /**
   * Stop collecting
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Collect current system metrics
   */
  private async collect(): Promise<void> {
    try {
      const metrics = this.getSystemMetrics();

      // Check thresholds defined in the "Golden Signals" table

      // Memory
      const memUsage = metrics.memory.percentage;
      const memThresholds = this.config.thresholds?.memory || { warning: 0.6, critical: 0.8 };

      if (memUsage > memThresholds.critical) {
        await this.config.monitor.alert({
          severity: 'CRITICAL',
          title: 'Critical Memory Usage',
          message: `Memory usage at ${(memUsage * 100).toFixed(1)}% (Critical > ${memThresholds.critical * 100}%)`,
          metrics: { ...metrics, action: 'Check for leaks' },
        });
      } else if (memUsage > memThresholds.warning) {
        await this.config.monitor.alert({
          severity: 'WARNING',
          title: 'High Memory Usage',
          message: `Memory usage at ${(memUsage * 100).toFixed(1)}% (Warning > ${memThresholds.warning * 100}%)`,
          metrics: { ...metrics, action: 'Check for leaks' },
        });
      }

      // CPU
      const cpuUsage = metrics.cpu.usage;
      const cpuThresholds = this.config.thresholds?.cpu || { warning: 0.5, critical: 0.7 };

      if (cpuUsage > cpuThresholds.critical) {
        await this.config.monitor.alert({
          severity: 'CRITICAL',
          title: 'Critical CPU Usage',
          message: `CPU usage at ${(cpuUsage * 100).toFixed(1)}% (Critical > ${cpuThresholds.critical * 100}%)`,
          metrics: { ...metrics, action: 'Scale up' },
        });
      } else if (cpuUsage > cpuThresholds.warning) {
        await this.config.monitor.alert({
          severity: 'WARNING',
          title: 'High CPU Usage',
          message: `CPU usage at ${(cpuUsage * 100).toFixed(1)}% (Warning > ${cpuThresholds.warning * 100}%)`,
          metrics: { ...metrics, action: 'Scale up' },
        });
      }
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Get current system metrics
   */
  private getSystemMetrics(): ISystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const cpuInfo = this.getCpuUsage();

    return {
      cpu: {
        usage: cpuInfo.usage,
        average: cpuInfo.average,
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: usedMemory / totalMemory,
      },
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  /**
   * Calculate CPU usage
   */
  private getCpuUsage(): { usage: number; average: number } {
    const currentUsage = process.cpuUsage(this.previousCpuUsage || undefined);
    this.previousCpuUsage = process.cpuUsage();

    const totalUsage = currentUsage.user + currentUsage.system;
    const elapsedTime = this.config.systemMetricsInterval * 1000; // microseconds

    const usage = totalUsage / elapsedTime;

    // Get CPU load average (1 minute)
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const average = loadAvg / cpuCount;

    return {
      usage: Math.min(usage, 1), // Cap at 100%
      average: Math.min(average, 1),
    };
  }
}
