import type { IInstrumentationConfig } from './types';

/**
 * Monitor for DB Connections and Queue Lengths
 * Allows plugging in custom count functions
 */
export class ExternalResourceMonitor {
  private config: Required<IInstrumentationConfig>;
  private dbCountFn?: () => Promise<number> | number;
  private queueCountFn?: () => Promise<number> | number;
  private intervalId: any = null;

  constructor(config: Required<IInstrumentationConfig>) {
    this.config = config;
  }

  /**
   * Register a function to count active DB connections
   */
  registerDbConnectionCheck(fn: () => Promise<number> | number): void {
    this.dbCountFn = fn;
  }

  /**
   * Register a function to count queue length
   */
  registerQueueCheck(fn: () => Promise<number> | number): void {
    this.queueCountFn = fn;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.check(), 30000); // Check every 30s
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async check(): Promise<void> {
    // 1. Check DB Connections
    if (this.dbCountFn) {
      try {
        const connections = await this.dbCountFn();
        const thresholds = this.config.thresholds?.dbConnections || { warning: 50, critical: 80 }; // assuming generic numbers if not %

        // If thresholds are < 1, treat as percentage (user must normalize 'connections' value likely,
        // but typically users explicitly pass max pool size. Complexity.
        // For plug-and-play, lets assume the user returns a PERCENTAGE (0-1) or we stick to raw numbers if thresholds are big.
        // The table says "< 50%", so it expects percentage.
        // We will assume the callback returns percentage 0-100 or 0-1. Let's assume 0-100 for ease of Table mapping.

        // Actually table says "DB Connections < 50%".

        if (connections > thresholds.critical) {
          await this.config.monitor.alert({
            severity: 'CRITICAL',
            title: 'Critical DB Connection Usage',
            message: `DB Connections at ${connections}% (Critical > ${thresholds.critical}%)`,
            metrics: { connections, action: 'Increase pool' },
          });
        } else if (connections > thresholds.warning) {
          await this.config.monitor.alert({
            severity: 'WARNING',
            title: 'High DB Connection Usage',
            message: `DB Connections at ${connections}% (Warning > ${thresholds.warning}%)`,
            metrics: { connections, action: 'Increase pool' },
          });
        }
      } catch (e) {
        console.error('Error checking DB connections', e);
      }
    }

    // 2. Check Queue Length
    if (this.queueCountFn) {
      try {
        const length = await this.queueCountFn();
        const thresholds = this.config.thresholds?.queueLength || { warning: 100, critical: 1000 };

        if (length > thresholds.critical) {
          await this.config.monitor.alert({
            severity: 'CRITICAL',
            title: 'Critical Queue Length',
            message: `Queue length is ${length} (Critical > ${thresholds.critical})`,
            metrics: { length, action: 'Add workers' },
          });
        } else if (length > thresholds.warning) {
          await this.config.monitor.alert({
            severity: 'WARNING',
            title: 'High Queue Length',
            message: `Queue length is ${length} (Warning > ${thresholds.warning})`,
            metrics: { length, action: 'Add workers' },
          });
        }
      } catch (e) {
        console.error('Error checking Queue length', e);
      }
    }
  }
}
