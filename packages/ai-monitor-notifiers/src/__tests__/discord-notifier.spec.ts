const mockAxiosPost = jest.fn().mockResolvedValue({ data: 'ok' });

jest.mock(
  'axios',
  () => ({
    post: mockAxiosPost,
  }),
  { virtual: true },
);

import type { IAlert, IDailyReport, IDeployment, IPipelineStatus } from '@aker/ai-monitor-core';
import { DiscordNotifier } from '../discord-notifier';

describe('DiscordNotifier', () => {
  let notifier: DiscordNotifier;

  beforeEach(() => {
    mockAxiosPost.mockClear();
    notifier = new DiscordNotifier({ webhookUrl: 'https://discord.com/api/webhooks/test' });
  });

  describe('send()', () => {
    it('sends content as plain text', async () => {
      await notifier.send('hello discord');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({ content: 'hello discord' }),
      );
    });
  });

  describe('sendAlert()', () => {
    it('sends embed with severity color', async () => {
      const alert: IAlert = {
        severity: 'CRITICAL',
        title: 'Server Down',
        message: 'API not responding',
        timestamp: new Date('2026-01-01T00:00:00Z'),
      };

      await notifier.sendAlert(alert);

      const payload = mockAxiosPost.mock.calls[0][1];
      expect(payload.embeds).toHaveLength(1);
      expect(payload.embeds[0].title).toContain('🚨');
      expect(payload.embeds[0].title).toContain('Server Down');
      expect(payload.embeds[0].color).toBe(0xed4245); // Red
      expect(payload.embeds[0].description).toBe('API not responding');
    });

    it('includes metrics as code block field', async () => {
      const alert: IAlert = {
        severity: 'WARNING',
        title: 'Slow',
        message: 'Latency high',
        metrics: { p95: 500 },
      };

      await notifier.sendAlert(alert);

      const fields = mockAxiosPost.mock.calls[0][1].embeds[0].fields;
      const metricsField = fields.find((f: any) => f.name === 'Metrics');
      expect(metricsField).toBeDefined();
      expect(metricsField.value).toContain('p95');
    });
  });

  describe('sendPipelineStatus()', () => {
    it('sends pipeline embed', async () => {
      const status: IPipelineStatus = {
        jobName: 'build-api',
        buildNumber: '42',
        status: 'SUCCESS',
      };

      await notifier.sendPipelineStatus(status);

      const embed = mockAxiosPost.mock.calls[0][1].embeds[0];
      expect(embed.title).toContain('✅');
      expect(embed.color).toBe(0x57f287); // Green
    });
  });

  describe('sendDeploymentNotification()', () => {
    it('sends deployment embed', async () => {
      const dep: IDeployment = {
        environment: 'production',
        version: '2.0.0',
        status: 'FAILURE',
      };

      await notifier.sendDeploymentNotification(dep);

      const embed = mockAxiosPost.mock.calls[0][1].embeds[0];
      expect(embed.title).toContain('❌');
      expect(embed.color).toBe(0xed4245); // Red
    });
  });

  describe('sendDailyReport()', () => {
    it('sends daily report embed', async () => {
      const report: IDailyReport = {
        date: new Date('2026-01-01'),
        totalAlerts: 3,
        criticalAlerts: 1,
        autoFixes: 2,
        uptime: '99.5%',
        topIssues: ['Memory leak'],
      };

      await notifier.sendDailyReport(report);

      const embed = mockAxiosPost.mock.calls[0][1].embeds[0];
      expect(embed.title).toContain('📊');
      const totalField = embed.fields.find((f: any) => f.name === 'Total Alerts');
      expect(totalField.value).toBe('3');
    });
  });

  describe('custom username', () => {
    it('includes username when configured', async () => {
      const customNotifier = new DiscordNotifier({
        webhookUrl: 'https://discord.com/api/webhooks/test',
        username: 'Monitor Bot',
      });

      await customNotifier.send('test');

      const payload = mockAxiosPost.mock.calls[0][1];
      expect(payload.username).toBe('Monitor Bot');
    });
  });
});
