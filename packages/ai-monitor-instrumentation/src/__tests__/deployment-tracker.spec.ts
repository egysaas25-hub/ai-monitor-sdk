import { DeploymentTracker } from '../deployment-tracker';

describe('DeploymentTracker', () => {
  let tracker: DeploymentTracker;

  beforeEach(() => {
    // 10 minute window
    tracker = new DeploymentTracker({ correlationWindowMs: 10 * 60 * 1000 });
  });

  it('should record deployments and drop oldest when exceeding max', () => {
    tracker = new DeploymentTracker({ maxEvents: 2, correlationWindowMs: 60000 });
    tracker.recordDeployment({ version: 'v1', time: new Date() });
    tracker.recordDeployment({ version: 'v2', time: new Date() });
    tracker.recordDeployment({ version: 'v3', time: new Date() });

    const deps = tracker.getDeployments();
    expect(deps.length).toBe(2);
    expect(deps[0].version).toBe('v2'); // v1 was dropped
    expect(deps[1].version).toBe('v3');
  });

  it('should successfully correlate an alert to a recent deployment', () => {
    const deployTime = new Date('2026-05-01T10:00:00Z');
    tracker.recordDeployment({ version: 'v1', time: deployTime, service: 'api' });

    // Alert happens 5 minutes later
    const alertTime = new Date('2026-05-01T10:05:00Z');
    const match = tracker.correlate(alertTime);

    expect(match).not.toBeNull();
    expect(match?.deployment.version).toBe('v1');
    expect(match?.timeSinceDeployMs).toBe(5 * 60 * 1000);
  });

  it('should not correlate alerts that happened prior to deploy', () => {
    const deployTime = new Date('2026-05-01T10:00:00Z');
    tracker.recordDeployment({ version: 'v1', time: deployTime });

    // Alert happens 5 minutes before the deploy
    const alertTime = new Date('2026-05-01T09:55:00Z');
    const match = tracker.correlate(alertTime);

    expect(match).toBeNull();
  });

  it('should not correlate alerts that happened after correlation window', () => {
    const deployTime = new Date('2026-05-01T10:00:00Z');
    tracker.recordDeployment({ version: 'v1', time: deployTime });

    // Alert happens 15 minutes later (window is 10 min)
    const alertTime = new Date('2026-05-01T10:15:00Z');
    const match = tracker.correlate(alertTime);

    expect(match).toBeNull();
  });
});
