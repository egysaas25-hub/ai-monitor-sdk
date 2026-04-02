import { SyntheticRunner } from '../synthetics/synthetic-runner';
import type { IAlert } from '../types';
import type { ISyntheticWorkflow } from '../synthetics/types';

describe('SyntheticRunner', () => {
  let alerts: IAlert[];
  let runner: SyntheticRunner;

  beforeEach(() => {
    alerts = [];
    runner = new SyntheticRunner(async (alert) => { alerts.push(alert); });
  });

  afterEach(() => {
    runner.stop();
  });

  const makeWorkflow = (overrides?: Partial<ISyntheticWorkflow>): ISyntheticWorkflow => ({
    name: 'test-workflow',
    intervalMs: 600_000, // long interval so scheduled runs don't fire during tests
    steps: [
      {
        name: 'step-1',
        execute: async () => ({ passed: true, durationMs: 10 }),
      },
    ],
    ...overrides,
  });

  it('should register and run a passing workflow', async () => {
    runner.addWorkflow(makeWorkflow());
    runner.start();

    // Wait for immediate run
    await new Promise((r) => setTimeout(r, 100));

    const history = runner.getHistory('test-workflow');
    expect(history.length).toBe(1);
    expect(history[0].passed).toBe(true);
    expect(history[0].stepResults[0].stepName).toBe('step-1');
    // No alerts on first pass (assumed passing initially)
    expect(alerts.length).toBe(0);
  });

  it('should fire CRITICAL alert when a step fails', async () => {
    const workflow = makeWorkflow({
      steps: [
        {
          name: 'failing-step',
          execute: async () => ({ passed: false, durationMs: 5, error: 'connection refused' }),
        },
      ],
    });

    runner.addWorkflow(workflow);
    runner.start();
    await new Promise((r) => setTimeout(r, 100));

    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('CRITICAL');
    expect(alerts[0].title).toContain('FAILED');
  });

  it('should fire INFO alert on recovery', async () => {
    let shouldFail = true;
    const workflow = makeWorkflow({
      steps: [
        {
          name: 'flaky-step',
          execute: async () => {
            if (shouldFail) {
              return { passed: false, durationMs: 5, error: 'flaky' };
            }
            return { passed: true, durationMs: 5 };
          },
        },
      ],
    });

    runner.addWorkflow(workflow);
    runner.start();
    await new Promise((r) => setTimeout(r, 100));

    // First run failed
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('CRITICAL');

    // Fix the step and trigger manually via stop/start
    shouldFail = false;
    runner.stop();
    runner.start();
    await new Promise((r) => setTimeout(r, 100));

    expect(alerts.length).toBe(2);
    expect(alerts[1].severity).toBe('INFO');
    expect(alerts[1].title).toContain('recovered');
  });

  it('should handle step exceptions gracefully', async () => {
    const workflow = makeWorkflow({
      steps: [
        {
          name: 'throwing-step',
          execute: async () => { throw new Error('boom'); },
        },
      ],
    });

    runner.addWorkflow(workflow);
    runner.start();
    await new Promise((r) => setTimeout(r, 100));

    const history = runner.getHistory('test-workflow');
    expect(history[0].passed).toBe(false);
    expect(history[0].stepResults[0].error).toBe('boom');
  });

  it('should return summary for all workflows', async () => {
    runner.addWorkflow(makeWorkflow());
    runner.start();
    await new Promise((r) => setTimeout(r, 100));

    const summary = runner.getSummary();
    expect(summary['test-workflow']).toBeDefined();
    expect(summary['test-workflow'].passing).toBe(true);
    expect(summary['test-workflow'].lastRun).toBeDefined();
  });
});
