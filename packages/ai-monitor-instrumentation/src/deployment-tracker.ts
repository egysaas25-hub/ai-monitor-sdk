import type { IAlert } from '@momen124/ai-monitor-core';

/**
 * Deployment event for correlation tracking.
 */
export interface IDeploymentEvent {
  version: string;
  time: Date;
  actor?: string;
  environment?: string;
  service?: string;
}

/**
 * Correlation result when an alert is linked to a recent deployment.
 */
export interface IDeploymentCorrelation {
  deployment: IDeploymentEvent;
  timeSinceDeployMs: number;
}

/**
 * DeploymentTracker stores recent deployment events and correlates
 * them with incoming alerts to detect deployment-triggered regressions.
 */
export class DeploymentTracker {
  private deployments: IDeploymentEvent[] = [];
  private readonly maxEvents: number;
  private readonly correlationWindowMs: number;

  /**
   * @param opts.maxEvents Maximum deployment events to retain (default: 100)
   * @param opts.correlationWindowMs Time window in ms to consider a deploy relevant (default: 30 min)
   */
  constructor(opts?: { maxEvents?: number; correlationWindowMs?: number }) {
    this.maxEvents = opts?.maxEvents ?? 100;
    this.correlationWindowMs = opts?.correlationWindowMs ?? 30 * 60 * 1000;
  }

  /** Record a new deployment event. */
  recordDeployment(event: IDeploymentEvent): void {
    this.deployments.push(event);
    if (this.deployments.length > this.maxEvents) {
      this.deployments.shift();
    }
  }

  /**
   * Check if an alert timestamp falls within the correlation window
   * after any recent deployment.
   */
  correlate(alertTimestamp: Date): IDeploymentCorrelation | null {
    const alertMs = alertTimestamp.getTime();

    // Search newest-first for the closest deployment
    for (let i = this.deployments.length - 1; i >= 0; i--) {
      const dep = this.deployments[i];
      const depMs = dep.time.getTime();
      const diff = alertMs - depMs;

      // Alert must come AFTER the deployment and within the window
      if (diff >= 0 && diff <= this.correlationWindowMs) {
        return {
          deployment: dep,
          timeSinceDeployMs: diff,
        };
      }
    }

    return null;
  }

  /** Return all stored deployment events. */
  getDeployments(): IDeploymentEvent[] {
    return [...this.deployments];
  }

  /** Clear all recorded deployments. */
  clear(): void {
    this.deployments = [];
  }
}
