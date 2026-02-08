import type { IInstrumentationConfig, IThresholds } from '../types';

// We need to mock the monitor to avoid real network calls
function mockMonitor() {
  return {
    alert: jest.fn().mockResolvedValue(undefined),
    start: jest.fn(),
    stop: jest.fn(),
    pipelineStatus: jest.fn(),
    deployment: jest.fn(),
    dailyReport: jest.fn(),
    notify: jest.fn(),
  };
}

function createConfig(overrides: Partial<IInstrumentationConfig> = {}) {
  return {
    monitor: mockMonitor(),
    enablePrometheus: false,
    captureErrors: true,
    capturePerformance: true,
    captureHttp: true,
    captureDatabase: true,
    captureSystemMetrics: false,
    systemMetricsInterval: 60000,
    appName: 'test-app',
    environment: 'test',
    performanceThreshold: 500,
    errorFilter: undefined,
    thresholds: undefined,
    ...overrides,
  } as any;
}

// Import after helpers so they're available
import { MetricAggregator } from '../metric-aggregator';

describe('MetricAggregator', () => {
  // ---- P95 Calculation ------------------------------------------------------

  describe('P95 calculation', () => {
    it('does not alert when response times are under warning threshold', async () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      // Record 20 requests all at 100ms (well under 200ms warning)
      for (let i = 0; i < 20; i++) {
        aggregator.recordRequest(100, false);
      }

      // Trigger aggregation manually
      await (aggregator as any).aggregateAndAlert();

      expect(config.monitor.alert).not.toHaveBeenCalled();
    });

    it('sends WARNING when P95 exceeds warning threshold', async () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      // 19 fast + 1 slow (the slow one is at P95)
      for (let i = 0; i < 19; i++) {
        aggregator.recordRequest(50, false);
      }
      aggregator.recordRequest(300, false); // > 200ms warning

      await (aggregator as any).aggregateAndAlert();

      expect(config.monitor.alert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'WARNING',
          title: expect.stringContaining('Latency'),
        }),
      );
    });

    it('sends CRITICAL when P95 exceeds critical threshold', async () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      // 19 fast + 1 very slow
      for (let i = 0; i < 19; i++) {
        aggregator.recordRequest(50, false);
      }
      aggregator.recordRequest(600, false); // > 500ms critical

      await (aggregator as any).aggregateAndAlert();

      expect(config.monitor.alert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'CRITICAL',
          title: expect.stringContaining('Critical Latency'),
        }),
      );
    });
  });

  // ---- Error Rate -----------------------------------------------------------

  describe('error rate', () => {
    it('sends CRITICAL when error rate exceeds critical threshold', async () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      // 100 requests, 5 errors → 5% error rate (> 1% critical)
      for (let i = 0; i < 95; i++) {
        aggregator.recordRequest(50, false);
      }
      for (let i = 0; i < 5; i++) {
        aggregator.recordRequest(50, true);
      }

      await (aggregator as any).aggregateAndAlert();

      // Should have at least the error rate alert
      const errorRateAlert = config.monitor.alert.mock.calls.find((call: any[]) =>
        call[0].title?.includes('Error Rate'),
      );
      expect(errorRateAlert).toBeDefined();
      expect(errorRateAlert![0].severity).toBe('CRITICAL');
    });
  });

  // ---- Window reset ---------------------------------------------------------

  describe('window reset', () => {
    it('resets counters after aggregation', async () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      aggregator.recordRequest(600, true); // triggers both alerts
      await (aggregator as any).aggregateAndAlert();

      // Reset: next aggregation with no data should not alert
      config.monitor.alert.mockClear();
      await (aggregator as any).aggregateAndAlert();

      expect(config.monitor.alert).not.toHaveBeenCalled();
    });
  });

  // ---- Empty window ---------------------------------------------------------

  describe('empty window', () => {
    it('skips aggregation when no requests recorded', async () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      await (aggregator as any).aggregateAndAlert();
      expect(config.monitor.alert).not.toHaveBeenCalled();
    });
  });

  // ---- Custom thresholds ----------------------------------------------------

  describe('custom thresholds', () => {
    it('uses custom thresholds', async () => {
      const config = createConfig({
        thresholds: {
          responseTime: { warning: 50, critical: 100 },
          errorRate: { warning: 0.01, critical: 0.05 },
        } as IThresholds,
      });
      const aggregator = new MetricAggregator(config);

      // 80ms should be WARNING with custom 50ms threshold
      for (let i = 0; i < 20; i++) {
        aggregator.recordRequest(80, false);
      }

      await (aggregator as any).aggregateAndAlert();

      expect(config.monitor.alert).toHaveBeenCalledWith(expect.objectContaining({ severity: 'WARNING' }));
    });
  });

  // ---- Lifecycle ------------------------------------------------------------

  describe('start / stop', () => {
    it('starts and stops without error', () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      aggregator.start();
      aggregator.stop();
    });
  });

  // ---- getThresholds --------------------------------------------------------

  describe('getThresholds()', () => {
    it('returns current thresholds', () => {
      const config = createConfig();
      const aggregator = new MetricAggregator(config);

      const thresholds = aggregator.getThresholds();
      expect(thresholds.responseTime).toBeDefined();
      expect(thresholds.errorRate).toBeDefined();
      expect(thresholds.cpu).toBeDefined();
      expect(thresholds.memory).toBeDefined();
    });
  });
});
