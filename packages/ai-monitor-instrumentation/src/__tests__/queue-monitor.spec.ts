import { QueueMonitor } from '../queue-monitor';
import type { IAlert } from '@momen124/ai-monitor-core';

describe('QueueMonitor', () => {
  let alerts: IAlert[];
  let monitor: QueueMonitor;

  beforeEach(() => {
    alerts = [];
    monitor = new QueueMonitor(async (alert) => { alerts.push(alert); }, {
      depthWarning: 10,
      depthCritical: 20,
    });
  });

  it('should track enqueue and dequeue operations', () => {
    monitor.recordEnqueue(5);
    monitor.recordDequeue(50); // took 50ms
    monitor.recordDequeue(150); // took 150ms
    monitor.recordError();

    const metrics = monitor.getMetrics();
    expect(metrics.depth).toBe(3); // 5 - 2
    expect(metrics.totalEnqueued).toBe(5);
    expect(metrics.totalDequeued).toBe(2);
    expect(metrics.totalErrors).toBe(1);
    expect(metrics.avgProcessingMs).toBe(100); // (50+150)/2
  });

  it('should trigger WARNING then CRITICAL alert based on depth', () => {
    monitor.recordEnqueue(10); // hits warning (10)
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('WARNING');

    monitor.recordEnqueue(12); // hits critical (22)
    expect(alerts.length).toBe(2);
    expect(alerts[1].severity).toBe('CRITICAL');

    // Should not re-fire critical repeatedly
    monitor.recordEnqueue(5);
    expect(alerts.length).toBe(2); // no new alert

    // Drops back to healthy zone, reset alert severity internally
    for (let i = 0; i < 20; i++) {
        monitor.recordDequeue(10);
    }
    monitor.recordEnqueue(10); // hits warning again
    expect(alerts.length).toBe(4);
    expect(alerts[3].severity).toBe('WARNING');
  });

  it('should reset properly', () => {
    monitor.recordEnqueue(10);
    monitor.recordError();
    monitor.reset();

    const metrics = monitor.getMetrics();
    expect(metrics.depth).toBe(0);
    expect(metrics.totalErrors).toBe(0);
  });
});
