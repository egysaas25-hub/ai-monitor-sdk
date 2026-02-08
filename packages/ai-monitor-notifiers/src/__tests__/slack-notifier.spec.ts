/**
 * Tests for SlackNotifier
 *
 * We test the message formatting logic by mocking the axios dependency.
 * The notifier uses `require('axios')` at construction time, so we
 * control it via jest.mock.
 */

const mockAxiosPost = jest.fn().mockResolvedValue({ data: 'ok' });

jest.mock(
  'axios',
  () => ({
    post: mockAxiosPost,
  }),
  { virtual: true },
);

import type { IAlert, IDailyReport, IDeployment, IPipelineStatus } from '@aker/ai-monitor-core';
import { SlackNotifier } from '../slack-notifier';

describe('SlackNotifier', () => {
  let notifier: SlackNotifier;

  beforeEach(() => {
    mockAxiosPost.mockClear();
    notifier = new SlackNotifier({ webhookUrl: 'https://hooks.slack.com/test' });
  });

  // ---- send() ---------------------------------------------------------------

  describe('send()', () => {
    it('posts text payload to webhook', async () => {
      await notifier.send('hello slack');

      expect(mockAxiosPost).toHaveBeenCalledWith('https://hooks.slack.com/test', { text: 'hello slack' });
    });

    it('throws on post failure', async () => {
      mockAxiosPost.mockRejectedValueOnce(new Error('network'));
      await expect(notifier.send('fail')).rejects.toThrow('network');
    });
  });

  // ---- sendAlert() ----------------------------------------------------------

  describe('sendAlert()', () => {
    it('sends structured attachment with severity color', async () => {
      const alert: IAlert = {
        severity: 'CRITICAL',
        title: 'CPU Spike',
        message: 'CPU is at 99%',
        timestamp: new Date('2026-01-01T00:00:00Z'),
      };

      await notifier.sendAlert(alert);

      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      const payload = mockAxiosPost.mock.calls[0][1];

      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments[0].color).toBe('danger');
      expect(payload.attachments[0].title).toContain('🚨');
      expect(payload.attachments[0].title).toContain('CPU Spike');
      expect(payload.attachments[0].text).toBe('CPU is at 99%');
    });

    it('includes metrics as fields when provided', async () => {
      const alert: IAlert = {
        severity: 'WARNING',
        title: 'Slow',
        message: 'Latency high',
        metrics: { p95: 500 },
      };

      await notifier.sendAlert(alert);

      const fields = mockAxiosPost.mock.calls[0][1].attachments[0].fields;
      const metricsField = fields.find((f: any) => f.title === 'Metrics');
      expect(metricsField).toBeDefined();
    });
  });

  // ---- sendPipelineStatus() -------------------------------------------------

  describe('sendPipelineStatus()', () => {
    it('sends pipeline notification', async () => {
      const status: IPipelineStatus = {
        jobName: 'build-api',
        buildNumber: '42',
        status: 'SUCCESS',
        duration: 120,
      };

      await notifier.sendPipelineStatus(status);

      const payload = mockAxiosPost.mock.calls[0][1];
      expect(payload.attachments[0].color).toBe('good');
      expect(payload.attachments[0].title).toContain('build-api');
    });
  });

  // ---- sendDeploymentNotification() -----------------------------------------

  describe('sendDeploymentNotification()', () => {
    it('sends deployment notification with status color', async () => {
      const dep: IDeployment = {
        environment: 'production',
        version: '2.0.0',
        status: 'FAILURE',
      };

      await notifier.sendDeploymentNotification(dep);

      const payload = mockAxiosPost.mock.calls[0][1];
      expect(payload.attachments[0].color).toBe('danger');
    });
  });

  // ---- sendDailyReport() ----------------------------------------------------

  describe('sendDailyReport()', () => {
    it('sends daily report with summary fields', async () => {
      const report: IDailyReport = {
        date: new Date('2026-01-01'),
        totalAlerts: 3,
        criticalAlerts: 1,
        autoFixes: 2,
        uptime: '99.5%',
        topIssues: ['Memory leak'],
      };

      await notifier.sendDailyReport(report);

      const fields = mockAxiosPost.mock.calls[0][1].attachments[0].fields;
      expect(fields.find((f: any) => f.title === 'Total Alerts').value).toBe('3');
      expect(fields.find((f: any) => f.title === 'Critical').value).toBe('1');
    });
  });
});
