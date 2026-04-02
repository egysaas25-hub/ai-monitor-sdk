/**
 * Synthetic workflow types
 */

/**
 * A single step inside a synthetic workflow.
 */
export interface ISyntheticStep {
  /** Human-readable step name */
  name: string;
  /** Async function that performs the check */
  execute: () => Promise<ISyntheticStepResult>;
}

/**
 * Result of a single synthetic step execution.
 */
export interface ISyntheticStepResult {
  passed: boolean;
  durationMs: number;
  error?: string;
}

/**
 * Definition of a synthetic workflow (a sequence of steps).
 */
export interface ISyntheticWorkflow {
  /** Unique workflow name */
  name: string;
  /** Polling interval in ms (default: 60_000) */
  intervalMs?: number;
  /** Ordered list of steps to execute */
  steps: ISyntheticStep[];
}

/**
 * Result of a full workflow run (all steps).
 */
export interface ISyntheticRunResult {
  workflowName: string;
  passed: boolean;
  startedAt: Date;
  durationMs: number;
  stepResults: Array<ISyntheticStepResult & { stepName: string }>;
  error?: string;
}
