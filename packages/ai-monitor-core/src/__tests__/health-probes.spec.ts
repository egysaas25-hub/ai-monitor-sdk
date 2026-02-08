import { HealthProbeManager } from '../health-probes';

describe('HealthProbeManager', () => {
  let probeManager: HealthProbeManager;
  let alertFn: jest.Mock;

  beforeEach(() => {
    alertFn = jest.fn().mockResolvedValue(undefined);
    probeManager = new HealthProbeManager(alertFn);
  });

  afterEach(() => {
    probeManager.stop();
  });

  describe('addCustomProbe()', () => {
    it('adds and runs a healthy custom probe', async () => {
      probeManager.addCustomProbe(
        'test-db',
        async () => ({
          healthy: true,
        }),
        { intervalMs: 60_000 },
      ); // Long interval — we run manually

      probeManager.start();

      // Wait for initial run
      await new Promise((r) => setTimeout(r, 100));

      const status = probeManager.getStatus();
      expect(status['test-db']).toBeDefined();
      expect(status['test-db'].healthy).toBe(true);
      expect(status['test-db'].consecutiveFailures).toBe(0);

      // No failure alerts fired
      // (alerts for initial success don't fire since we assume healthy from start)
    });

    it('fires alert on failed probe', async () => {
      probeManager.addCustomProbe(
        'redis',
        async () => ({
          healthy: false,
          message: 'Connection refused',
        }),
        { intervalMs: 60_000 },
      );

      probeManager.start();
      await new Promise((r) => setTimeout(r, 100));

      const status = probeManager.getStatus();
      expect(status['redis'].healthy).toBe(false);
      expect(status['redis'].lastError).toBe('Connection refused');
      expect(alertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'WARNING',
          title: expect.stringContaining('redis'),
        }),
      );
    });

    it('fires recovery alert when probe recovers', async () => {
      let healthy = false;
      probeManager.addCustomProbe(
        'api',
        async () => ({
          healthy,
        }),
        { intervalMs: 50 },
      ); // Faster for test

      probeManager.start();

      // Wait for initial failure
      await new Promise((r) => setTimeout(r, 80));
      expect(probeManager.getStatus()['api'].healthy).toBe(false);

      // Now recover
      healthy = true;
      await new Promise((r) => setTimeout(r, 100));

      // Should have recovery alert
      const recoveryCalls = alertFn.mock.calls.filter(
        (call: any[]) => call[0].severity === 'INFO' && call[0].title.includes('recovered'),
      );
      expect(recoveryCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStatus()', () => {
    it('returns empty when no probes configured', () => {
      expect(probeManager.getStatus()).toEqual({});
    });
  });

  describe('stop()', () => {
    it('clears all intervals', () => {
      probeManager.addCustomProbe('test', async () => ({ healthy: true }));
      probeManager.start();
      probeManager.stop();
      // Should not throw
    });
  });
});
