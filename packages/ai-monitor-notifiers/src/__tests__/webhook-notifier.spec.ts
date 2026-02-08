const mockAxios = jest.fn().mockResolvedValue({ data: 'ok' });

jest.mock('axios', () => mockAxios, { virtual: true });

import type { IAlert, IDailyReport, IDeployment, IPipelineStatus } from '@aker/ai-monitor-core';
import { WebhookNotifier } from '../webhook-notifier';

describe('WebhookNotifier', () => {
  let notifier: WebhookNotifier;

  beforeEach(() => {
    mockAxios.mockClear();
    notifier = new WebhookNotifier({ url: 'https://example.com/hook', retries: 0 });
  });

  describe('send()', () => {
    it('posts message payload', async () => {
      await notifier.send('hello');

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://example.com/hook',
          data: expect.objectContaining({ type: 'message', message: 'hello' }),
        }),
      );
    });
  });

  describe('sendAlert()', () => {
    it('posts alert payload', async () => {
      const alert: IAlert = {
        severity: 'CRITICAL',
        title: 'CPU Spike',
        message: 'CPU is 99%',
        timestamp: new Date('2026-01-01T00:00:00Z'),
      };

      await notifier.sendAlert(alert);

      const payload = mockAxios.mock.calls[0][0].data;
      expect(payload.type).toBe('alert');
      expect(payload.severity).toBe('CRITICAL');
      expect(payload.title).toBe('CPU Spike');
    });
  });

  describe('sendPipelineStatus()', () => {
    it('posts pipeline payload', async () => {
      const status: IPipelineStatus = {
        jobName: 'build',
        buildNumber: '42',
        status: 'SUCCESS',
      };

      await notifier.sendPipelineStatus(status);
      const payload = mockAxios.mock.calls[0][0].data;
      expect(payload.type).toBe('pipeline');
      expect(payload.jobName).toBe('build');
    });
  });

  describe('sendDeploymentNotification()', () => {
    it('posts deployment payload', async () => {
      const dep: IDeployment = {
        environment: 'production',
        version: '1.0.0',
        status: 'SUCCESS',
      };

      await notifier.sendDeploymentNotification(dep);
      const payload = mockAxios.mock.calls[0][0].data;
      expect(payload.type).toBe('deployment');
    });
  });

  describe('sendDailyReport()', () => {
    it('posts report payload', async () => {
      const report: IDailyReport = {
        date: new Date('2026-01-01'),
        totalAlerts: 5,
        criticalAlerts: 1,
        autoFixes: 2,
        uptime: '99.9%',
        topIssues: ['Memory'],
      };

      await notifier.sendDailyReport(report);
      const payload = mockAxios.mock.calls[0][0].data;
      expect(payload.type).toBe('daily_report');
    });
  });

  describe('retry', () => {
    it('retries on failure', async () => {
      const retryNotifier = new WebhookNotifier({
        url: 'https://example.com/hook',
        retries: 2,
        retryDelayMs: 10,
      });

      mockAxios
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValueOnce({ data: 'ok' });

      await retryNotifier.send('retry test');
      expect(mockAxios).toHaveBeenCalledTimes(3); // 1 + 2 retries
    });

    it('throws after exhausting retries', async () => {
      const retryNotifier = new WebhookNotifier({
        url: 'https://example.com/hook',
        retries: 1,
        retryDelayMs: 10,
      });

      mockAxios.mockRejectedValue(new Error('persistent failure'));

      await expect(retryNotifier.send('fail')).rejects.toThrow('persistent failure');
    });
  });
});
