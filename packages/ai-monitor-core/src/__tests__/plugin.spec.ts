import { type IPlugin, PluginManager } from '../plugin';
import type { IAlert } from '../types';

describe('PluginManager', () => {
  let pm: PluginManager;
  const mockMonitor: any = { alert: jest.fn(), notify: jest.fn() };

  const makeAlert = (): IAlert => ({
    severity: 'WARNING',
    title: 'Test',
    message: 'Hello',
    timestamp: new Date(),
  });

  beforeEach(() => {
    pm = new PluginManager();
  });

  describe('register()', () => {
    it('registers a plugin and calls onInit', async () => {
      const onInit = jest.fn();
      const plugin: IPlugin = { name: 'test', onInit };

      await pm.register(plugin, mockMonitor);

      expect(onInit).toHaveBeenCalledWith(mockMonitor);
      expect(pm.count).toBe(1);
    });

    it('registers without onInit', async () => {
      await pm.register({ name: 'no-init' }, mockMonitor);
      expect(pm.count).toBe(1);
    });
  });

  describe('runHook()', () => {
    it('calls onStart on all plugins', async () => {
      const onStart1 = jest.fn();
      const onStart2 = jest.fn();

      await pm.register({ name: 'p1', onStart: onStart1 }, mockMonitor);
      await pm.register({ name: 'p2', onStart: onStart2 }, mockMonitor);

      await pm.runHook('onStart', mockMonitor);

      expect(onStart1).toHaveBeenCalledWith(mockMonitor);
      expect(onStart2).toHaveBeenCalledWith(mockMonitor);
    });

    it('calls onStop on all plugins', async () => {
      const onStop = jest.fn();
      await pm.register({ name: 'p1', onStop }, mockMonitor);

      await pm.runHook('onStop', mockMonitor);
      expect(onStop).toHaveBeenCalledWith(mockMonitor);
    });

    it('skips plugins without the hook', async () => {
      await pm.register({ name: 'no-hooks' }, mockMonitor);
      await pm.runHook('onStart', mockMonitor); // Should not throw
    });
  });

  describe('processAlert()', () => {
    it('passes alert through when no plugins modify it', async () => {
      const alert = makeAlert();
      const result = await pm.processAlert(alert, mockMonitor);
      expect(result).toEqual(alert);
    });

    it('allows onAlert to modify the alert', async () => {
      await pm.register(
        {
          name: 'modifier',
          onAlert: (alert) => ({ ...alert, title: 'Modified' }),
        },
        mockMonitor,
      );

      const result = await pm.processAlert(makeAlert(), mockMonitor);
      expect(result?.title).toBe('Modified');
    });

    it('allows onAlert to suppress by returning null', async () => {
      await pm.register(
        {
          name: 'suppressor',
          onAlert: () => null,
        },
        mockMonitor,
      );

      const result = await pm.processAlert(makeAlert(), mockMonitor);
      expect(result).toBeNull();
    });

    it('allows onBeforeNotify to suppress', async () => {
      await pm.register(
        {
          name: 'gate',
          onBeforeNotify: () => false,
        },
        mockMonitor,
      );

      const result = await pm.processAlert(makeAlert(), mockMonitor);
      expect(result).toBeNull();
    });

    it('chains multiple plugins in order', async () => {
      await pm.register(
        {
          name: 'p1',
          onAlert: (alert) => ({ ...alert, title: alert.title + '-p1' }),
        },
        mockMonitor,
      );

      await pm.register(
        {
          name: 'p2',
          onAlert: (alert) => ({ ...alert, title: alert.title + '-p2' }),
        },
        mockMonitor,
      );

      const result = await pm.processAlert(makeAlert(), mockMonitor);
      expect(result?.title).toBe('Test-p1-p2');
    });
  });

  describe('getPlugin()', () => {
    it('retrieves a plugin by name', async () => {
      const plugin: IPlugin = { name: 'finder' };
      await pm.register(plugin, mockMonitor);

      expect(pm.getPlugin('finder')).toBe(plugin);
    });

    it('returns undefined for unknown name', () => {
      expect(pm.getPlugin('nope')).toBeUndefined();
    });
  });
});
