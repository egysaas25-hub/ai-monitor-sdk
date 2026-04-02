import { ConsoleLogger } from '../logger-adapter';
import type { IAlert, ILogger } from '../types';
import type {
  ISyntheticRunResult,
  ISyntheticWorkflow,
} from './types';

type AlertFn = (alert: IAlert) => Promise<void>;

/**
 * SyntheticRunner — schedules and executes synthetic workflow checks
 * on a configurable interval and fires alerts on failure/recovery.
 */
export class SyntheticRunner {
  private workflows = new Map<string, ISyntheticWorkflow>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private history = new Map<string, ISyntheticRunResult[]>();
  private lastState = new Map<string, boolean>(); // true = passing
  private alertFn: AlertFn;
  private logger: ILogger;
  private maxHistory: number;

  constructor(alertFn: AlertFn, opts?: { logger?: ILogger; maxHistory?: number }) {
    this.alertFn = alertFn;
    this.logger = opts?.logger ?? new ConsoleLogger();
    this.maxHistory = opts?.maxHistory ?? 50;
  }

  /** Register a synthetic workflow. */
  addWorkflow(workflow: ISyntheticWorkflow): this {
    this.workflows.set(workflow.name, workflow);
    this.history.set(workflow.name, []);
    this.lastState.set(workflow.name, true); // assume passing
    return this;
  }

  /** Start polling all registered workflows. */
  start(): void {
    for (const [name, workflow] of this.workflows) {
      const intervalMs = workflow.intervalMs ?? 60_000;

      const interval = setInterval(() => {
        this.runWorkflow(workflow).catch((err) => {
          this.logger.error(`Synthetic '${name}' runner error:`, err);
        });
      }, intervalMs);

      this.intervals.set(name, interval);

      // Run once immediately
      this.runWorkflow(workflow).catch((err) => {
        this.logger.error(`Synthetic '${name}' initial run error:`, err);
      });

      this.logger.info(`🧪 Synthetic '${name}' started (every ${intervalMs / 1000}s)`);
    }
  }

  /** Stop all synthetic workflows. */
  stop(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      this.logger.debug(`Synthetic '${name}' stopped`);
    }
    this.intervals.clear();
  }

  /** Get run history for a workflow. */
  getHistory(workflowName: string): ISyntheticRunResult[] {
    return [...(this.history.get(workflowName) ?? [])];
  }

  /** Get a summary of all workflows. */
  getSummary(): Record<string, { passing: boolean; lastRun?: ISyntheticRunResult }> {
    const summary: Record<string, { passing: boolean; lastRun?: ISyntheticRunResult }> = {};
    for (const [name] of this.workflows) {
      const hist = this.history.get(name) ?? [];
      summary[name] = {
        passing: this.lastState.get(name) ?? true,
        lastRun: hist[hist.length - 1],
      };
    }
    return summary;
  }

  /** Execute a single workflow run. */
  private async runWorkflow(workflow: ISyntheticWorkflow): Promise<void> {
    const runStart = Date.now();
    const stepResults: ISyntheticRunResult['stepResults'] = [];
    let workflowPassed = true;

    for (const step of workflow.steps) {
      const stepStart = Date.now();
      try {
        const result = await step.execute();
        stepResults.push({
          stepName: step.name,
          passed: result.passed,
          durationMs: result.durationMs,
          error: result.error,
        });
        if (!result.passed) {
          workflowPassed = false;
        }
      } catch (err: any) {
        const durationMs = Date.now() - stepStart;
        stepResults.push({
          stepName: step.name,
          passed: false,
          durationMs,
          error: err.message ?? 'Unknown step error',
        });
        workflowPassed = false;
      }
    }

    const runResult: ISyntheticRunResult = {
      workflowName: workflow.name,
      passed: workflowPassed,
      startedAt: new Date(runStart),
      durationMs: Date.now() - runStart,
      stepResults,
    };

    // Store history
    const hist = this.history.get(workflow.name)!;
    hist.push(runResult);
    if (hist.length > this.maxHistory) {
      hist.shift();
    }

    const wasPassing = this.lastState.get(workflow.name) ?? true;

    if (!workflowPassed && wasPassing) {
      // Transition: passing → failing
      const failedSteps = stepResults.filter((s) => !s.passed);
      await this.alertFn({
        severity: 'CRITICAL',
        title: `🧪 Synthetic '${workflow.name}' FAILED`,
        message: `Workflow failed at step(s): ${failedSteps.map((s) => `${s.stepName} (${s.error})`).join(', ')}`,
        metrics: { durationMs: runResult.durationMs, failedSteps: failedSteps.length },
        timestamp: new Date(),
      });
    } else if (workflowPassed && !wasPassing) {
      // Transition: failing → passing (recovery)
      await this.alertFn({
        severity: 'INFO',
        title: `✅ Synthetic '${workflow.name}' recovered`,
        message: `Workflow is passing again (${runResult.durationMs}ms)`,
        timestamp: new Date(),
      });
    }

    this.lastState.set(workflow.name, workflowPassed);
  }
}
