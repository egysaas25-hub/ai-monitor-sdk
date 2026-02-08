import type { IAlert } from './types';

/**
 * Alert Deduplication & Cooldown
 *
 * Prevents notification storms by suppressing duplicate alerts
 * within a configurable cooldown window. Uses a hash of
 * severity + title as the dedup key.
 */

export interface IDeduplicationConfig {
  /** Enable deduplication (default: true) */
  enabled?: boolean;
  /** Cooldown window in ms — same alert won't fire again within this period (default: 300_000 = 5 min) */
  cooldownMs?: number;
}

interface DedupEntry {
  lastSent: number;
  count: number;
}

export class AlertDeduplicator {
  private entries = new Map<string, DedupEntry>();
  private readonly cooldownMs: number;

  constructor(config: IDeduplicationConfig = {}) {
    this.cooldownMs = config.cooldownMs ?? 300_000; // 5 minutes default
  }

  /**
   * Compute a fingerprint for an alert based on severity + title.
   */
  private fingerprint(alert: IAlert): string {
    return `${alert.severity}::${alert.title}`;
  }

  /**
   * Check whether this alert should be sent.
   * Returns true if the alert has NOT been sent within the cooldown window.
   */
  shouldSend(alert: IAlert): boolean {
    const key = this.fingerprint(alert);
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry || now - entry.lastSent >= this.cooldownMs) {
      this.entries.set(key, { lastSent: now, count: (entry?.count ?? 0) + 1 });
      return true;
    }

    // Suppressed — increment count but don't update lastSent
    entry.count++;
    return false;
  }

  /**
   * Number of alerts suppressed since last reset.
   */
  get suppressedCount(): number {
    let total = 0;
    for (const entry of this.entries.values()) {
      total += Math.max(0, entry.count - 1);
    }
    return total;
  }

  /**
   * Reset all dedup state.
   */
  reset(): void {
    this.entries.clear();
  }

  /**
   * Reset a specific key by severity + title.
   */
  resetKey(severity: string, title: string): void {
    this.entries.delete(`${severity}::${title}`);
  }
}
