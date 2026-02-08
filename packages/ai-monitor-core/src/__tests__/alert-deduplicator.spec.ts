import { AlertDeduplicator } from '../alert-deduplicator';
import type { IAlert } from '../types';

describe('AlertDeduplicator', () => {
  let dedup: AlertDeduplicator;

  const makeAlert = (severity = 'WARNING', title = 'High CPU'): IAlert => ({
    severity: severity as any,
    title,
    message: 'CPU usage is 90%',
  });

  beforeEach(() => {
    dedup = new AlertDeduplicator({ cooldownMs: 1000 }); // 1s for fast tests
  });

  describe('shouldSend()', () => {
    it('allows the first alert', () => {
      expect(dedup.shouldSend(makeAlert())).toBe(true);
    });

    it('suppresses duplicate within cooldown window', () => {
      const alert = makeAlert();
      expect(dedup.shouldSend(alert)).toBe(true); // First — allowed
      expect(dedup.shouldSend(alert)).toBe(false); // Second — suppressed
    });

    it('allows same alert after cooldown expires', async () => {
      dedup = new AlertDeduplicator({ cooldownMs: 50 }); // 50ms cooldown
      const alert = makeAlert();

      expect(dedup.shouldSend(alert)).toBe(true);
      await new Promise((r) => setTimeout(r, 100)); // Wait beyond cooldown
      expect(dedup.shouldSend(alert)).toBe(true);
    });

    it('treats different severities as different alerts', () => {
      expect(dedup.shouldSend(makeAlert('WARNING', 'High CPU'))).toBe(true);
      expect(dedup.shouldSend(makeAlert('CRITICAL', 'High CPU'))).toBe(true);
    });

    it('treats different titles as different alerts', () => {
      expect(dedup.shouldSend(makeAlert('WARNING', 'High CPU'))).toBe(true);
      expect(dedup.shouldSend(makeAlert('WARNING', 'High Memory'))).toBe(true);
    });
  });

  describe('suppressedCount', () => {
    it('starts at zero', () => {
      expect(dedup.suppressedCount).toBe(0);
    });

    it('counts suppressed alerts', () => {
      const alert = makeAlert();
      dedup.shouldSend(alert); // Allowed
      dedup.shouldSend(alert); // Suppressed
      dedup.shouldSend(alert); // Suppressed
      expect(dedup.suppressedCount).toBe(2);
    });
  });

  describe('reset()', () => {
    it('clears all state', () => {
      const alert = makeAlert();
      dedup.shouldSend(alert);
      dedup.shouldSend(alert); // Suppressed
      dedup.reset();
      expect(dedup.shouldSend(alert)).toBe(true); // Allowed again
      expect(dedup.suppressedCount).toBe(0);
    });
  });

  describe('resetKey()', () => {
    it('clears a specific key', () => {
      const a1 = makeAlert('WARNING', 'CPU');
      const a2 = makeAlert('WARNING', 'Memory');

      dedup.shouldSend(a1);
      dedup.shouldSend(a2);
      dedup.resetKey('WARNING', 'CPU');

      expect(dedup.shouldSend(a1)).toBe(true); // Allowed (was reset)
      expect(dedup.shouldSend(a2)).toBe(false); // Still suppressed
    });
  });

  describe('default cooldown', () => {
    it('defaults to 5 minutes', () => {
      const defaultDedup = new AlertDeduplicator();
      const alert = makeAlert();
      expect(defaultDedup.shouldSend(alert)).toBe(true);
      expect(defaultDedup.shouldSend(alert)).toBe(false);
    });
  });
});
