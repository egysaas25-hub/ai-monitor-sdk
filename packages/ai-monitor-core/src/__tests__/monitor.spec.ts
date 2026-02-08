import { AIMonitor } from '../monitor';
import type { IAlert, IDailyReport, IDeployment, INotifier, IPipelineStatus } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockNotifier(): jest.Mocked<INotifier> {
  return {
    send: jest.fn().mockResolvedValue(undefined),
    sendAlert: jest.fn().mockResolvedValue(undefined),
    sendPipelineStatus: jest.fn().mockResolvedValue(undefined),
    sendDeploymentNotification: jest.fn().mockResolvedValue(undefined),
    sendDailyReport: jest.fn().mockResolvedValue(undefined),
  };
}

// Use a random high port to avoid conflicts
const randomPort = () => 30_000 + Math.floor(Math.random() * 10_000);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AIMonitor', () => {
  let monitor: AIMonitor;
  let port: number;

  afterEach(async () => {
    // Ensure server is stopped between tests
    try {
      await monitor?.stop();
    } catch {}
  });

  // ---- Construction ---------------------------------------------------------

  describe('construction', () => {
    it('creates with default config', () => {
      monitor = new AIMonitor();
      expect(monitor).toBeDefined();
    });

    it('accepts custom port and host', () => {
      port = randomPort();
      monitor = new AIMonitor({ host: '127.0.0.1', port });
      expect(monitor).toBeDefined();
    });

    it('logs warning when disabled', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      monitor = new AIMonitor({ enabled: false });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('disabled'));
      warnSpy.mockRestore();
    });
  });

  // ---- Lifecycle ------------------------------------------------------------

  describe('start / stop', () => {
    it('starts and responds to health check', async () => {
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1' });
      await monitor.start();

      // Use Node fetch (available in Node 18+)
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('healthy');
      expect(body.enabled).toBe(true);
    });

    it('returns 404 for unknown routes', async () => {
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1' });
      await monitor.start();

      const res = await fetch(`http://127.0.0.1:${port}/unknown`);
      expect(res.status).toBe(404);
    });

    it('warns on double start', async () => {
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1' });
      await monitor.start();
      // Second start should not throw
      await monitor.start();
    });

    it('stop on a non-started monitor is a no-op', async () => {
      monitor = new AIMonitor();
      await monitor.stop(); // should not throw
    });
  });

  // ---- Alert routing --------------------------------------------------------

  describe('alert()', () => {
    it('routes alerts to all notifiers', async () => {
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n1, n2] });

      const alert: IAlert = {
        severity: 'WARNING',
        title: 'Test Alert',
        message: 'Something happened',
      };

      await monitor.alert(alert);

      expect(n1.sendAlert).toHaveBeenCalledTimes(1);
      expect(n2.sendAlert).toHaveBeenCalledTimes(1);
      expect(n1.sendAlert).toHaveBeenCalledWith(expect.objectContaining({ severity: 'WARNING', title: 'Test Alert' }));
    });

    it('skips alert when disabled', async () => {
      const n = mockNotifier();
      monitor = new AIMonitor({ enabled: false, notifiers: [n] });

      await monitor.alert({ severity: 'CRITICAL', title: 'x', message: 'y' });
      expect(n.sendAlert).not.toHaveBeenCalled();
    });

    it('adds timestamp to alert if missing', async () => {
      const n = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n] });

      await monitor.alert({ severity: 'INFO', title: 'x', message: 'y' });

      const sentAlert = n.sendAlert.mock.calls[0][0];
      expect(sentAlert.timestamp).toBeInstanceOf(Date);
    });
  });

  // ---- Pipeline / Deployment / Report ---------------------------------------

  describe('pipelineStatus()', () => {
    it('routes through notifiers', async () => {
      const n = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n] });

      const status: IPipelineStatus = {
        jobName: 'build-api',
        buildNumber: '42',
        status: 'SUCCESS',
      };

      await monitor.pipelineStatus(status);
      expect(n.sendPipelineStatus).toHaveBeenCalledWith(status);
    });
  });

  describe('deployment()', () => {
    it('routes through notifiers', async () => {
      const n = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n] });

      const dep: IDeployment = {
        environment: 'production',
        version: '1.2.3',
        status: 'SUCCESS',
      };

      await monitor.deployment(dep);
      expect(n.sendDeploymentNotification).toHaveBeenCalledWith(dep);
    });
  });

  describe('dailyReport()', () => {
    it('routes through notifiers', async () => {
      const n = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n] });

      const report: IDailyReport = {
        date: new Date(),
        totalAlerts: 5,
        criticalAlerts: 1,
        autoFixes: 2,
        uptime: '99.9%',
        topIssues: ['Memory spike'],
      };

      await monitor.dailyReport(report);
      expect(n.sendDailyReport).toHaveBeenCalledWith(report);
    });
  });

  // ---- notify() raw message -------------------------------------------------

  describe('notify()', () => {
    it('sends raw message through notifiers', async () => {
      const n = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n] });

      await monitor.notify('hello world');
      expect(n.send).toHaveBeenCalledWith('hello world');
    });
  });

  // ---- Notifier failures ----------------------------------------------------

  describe('notifier error handling', () => {
    it('logs failure but does not throw when a notifier fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const failing: INotifier = {
        send: jest.fn().mockRejectedValue(new Error('boom')),
        sendAlert: jest.fn().mockRejectedValue(new Error('boom')),
        sendPipelineStatus: jest.fn().mockRejectedValue(new Error('boom')),
        sendDeploymentNotification: jest.fn().mockRejectedValue(new Error('boom')),
        sendDailyReport: jest.fn().mockRejectedValue(new Error('boom')),
      };

      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [failing] });

      // Should not throw
      await expect(monitor.alert({ severity: 'CRITICAL', title: 'x', message: 'y' })).resolves.toBeUndefined();

      errorSpy.mockRestore();
    });
  });

  // ---- HTTP endpoints -------------------------------------------------------

  describe('HTTP alert endpoint', () => {
    it('accepts POST /alert and routes through monitor', async () => {
      const n = mockNotifier();
      port = randomPort();
      monitor = new AIMonitor({ port, host: '127.0.0.1', notifiers: [n] });
      await monitor.start();

      const res = await fetch(`http://127.0.0.1:${port}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'INFO',
          title: 'HTTP Alert',
          message: 'from http',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(n.sendAlert).toHaveBeenCalledTimes(1);
    });
  });
});
