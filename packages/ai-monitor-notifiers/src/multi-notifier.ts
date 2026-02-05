import type {
  INotifier,
  IAlert,
  IPipelineStatus,
  IDeployment,
  IDailyReport
} from '@aker/ai-monitor-core';

/**
 * Multi-notifier configuration
 */
export interface IMultiNotifierConfig {
  notifiers: INotifier[];
  stopOnFirstError?: boolean;
}

/**
 * Multi-notifier implementation
 * Sends notifications to multiple notifiers using the composite pattern
 * Handles partial failures gracefully
 */
export class MultiNotifier implements INotifier {
  private notifiers: INotifier[];
  private stopOnFirstError: boolean;

  constructor(config: IMultiNotifierConfig) {
    this.notifiers = config.notifiers;
    this.stopOnFirstError = config.stopOnFirstError ?? false;
  }

  async send(message: string): Promise<void> {
    await this.executeOnAll(async (notifier) => notifier.send(message));
  }

  async sendAlert(alert: IAlert): Promise<void> {
    await this.executeOnAll(async (notifier) => notifier.sendAlert(alert));
  }

  async sendPipelineStatus(status: IPipelineStatus): Promise<void> {
    await this.executeOnAll(async (notifier) => notifier.sendPipelineStatus(status));
  }

  async sendDeploymentNotification(deployment: IDeployment): Promise<void> {
    await this.executeOnAll(async (notifier) => notifier.sendDeploymentNotification(deployment));
  }

  async sendDailyReport(report: IDailyReport): Promise<void> {
    await this.executeOnAll(async (notifier) => notifier.sendDailyReport(report));
  }

  /**
   * Execute action on all notifiers
   * Handles partial failures based on stopOnFirstError setting
   */
  private async executeOnAll(action: (notifier: INotifier) => Promise<void>): Promise<void> {
    if (this.stopOnFirstError) {
      // Sequential execution with fast-fail
      for (const notifier of this.notifiers) {
        await action(notifier);
      }
    } else {
      // Parallel execution with error collection
      const results = await Promise.allSettled(this.notifiers.map((notifier) => action(notifier)));

      // Check if all failed
      const allFailed = results.every((result) => result.status === 'rejected');
      if (allFailed) {
        const errors = results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason);
        throw new Error(`All notifiers failed: ${errors.join(', ')}`);
      }

      // Log individual failures but don't throw
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Notifier ${index} failed:`, result.reason);
        }
      });
    }
  }
}
