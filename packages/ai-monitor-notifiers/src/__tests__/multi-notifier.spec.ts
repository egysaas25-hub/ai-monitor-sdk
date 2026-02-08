import type { IAlert, INotifier } from '@aker/ai-monitor-core';
import { MultiNotifier } from '../multi-notifier';

function mockNotifier(): jest.Mocked<INotifier> {
  return {
    send: jest.fn().mockResolvedValue(undefined),
    sendAlert: jest.fn().mockResolvedValue(undefined),
    sendPipelineStatus: jest.fn().mockResolvedValue(undefined),
    sendDeploymentNotification: jest.fn().mockResolvedValue(undefined),
    sendDailyReport: jest.fn().mockResolvedValue(undefined),
  };
}

describe('MultiNotifier', () => {
  // ---- Fan-out --------------------------------------------------------------

  describe('parallel fan-out (default)', () => {
    it('sends alert to all notifiers', async () => {
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      const multi = new MultiNotifier({ notifiers: [n1, n2] });

      const alert: IAlert = { severity: 'WARNING', title: 'x', message: 'y' };
      await multi.sendAlert(alert);

      expect(n1.sendAlert).toHaveBeenCalledWith(alert);
      expect(n2.sendAlert).toHaveBeenCalledWith(alert);
    });

    it('sends raw message to all notifiers', async () => {
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      const multi = new MultiNotifier({ notifiers: [n1, n2] });

      await multi.send('hello');
      expect(n1.send).toHaveBeenCalledWith('hello');
      expect(n2.send).toHaveBeenCalledWith('hello');
    });

    it('sends pipeline status to all notifiers', async () => {
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      const multi = new MultiNotifier({ notifiers: [n1, n2] });

      const status = { jobName: 'x', buildNumber: '1', status: 'SUCCESS' as const };
      await multi.sendPipelineStatus(status);

      expect(n1.sendPipelineStatus).toHaveBeenCalledWith(status);
      expect(n2.sendPipelineStatus).toHaveBeenCalledWith(status);
    });
  });

  // ---- Partial failure handling ---------------------------------------------

  describe('partial failure handling', () => {
    it('succeeds when one notifier fails and one succeeds', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      n1.sendAlert.mockRejectedValue(new Error('n1 failed'));

      const multi = new MultiNotifier({ notifiers: [n1, n2] });

      // Should NOT throw because n2 succeeded
      await expect(multi.sendAlert({ severity: 'CRITICAL', title: 'x', message: 'y' })).resolves.toBeUndefined();

      expect(n2.sendAlert).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('throws when ALL notifiers fail', async () => {
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      n1.send.mockRejectedValue(new Error('fail1'));
      n2.send.mockRejectedValue(new Error('fail2'));

      const multi = new MultiNotifier({ notifiers: [n1, n2] });

      await expect(multi.send('test')).rejects.toThrow('All notifiers failed');
    });
  });

  // ---- stopOnFirstError mode ------------------------------------------------

  describe('stopOnFirstError mode', () => {
    it('stops on first error in sequential mode', async () => {
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      n1.send.mockRejectedValue(new Error('boom'));

      const multi = new MultiNotifier({ notifiers: [n1, n2], stopOnFirstError: true });

      await expect(multi.send('test')).rejects.toThrow('boom');
      // n2 should never be called because n1 failed first
      expect(n2.send).not.toHaveBeenCalled();
    });

    it('calls all in sequence when no errors', async () => {
      const order: number[] = [];
      const n1 = mockNotifier();
      const n2 = mockNotifier();
      n1.send.mockImplementation(async () => {
        order.push(1);
      });
      n2.send.mockImplementation(async () => {
        order.push(2);
      });

      const multi = new MultiNotifier({ notifiers: [n1, n2], stopOnFirstError: true });
      await multi.send('test');

      expect(order).toEqual([1, 2]);
    });
  });
});
