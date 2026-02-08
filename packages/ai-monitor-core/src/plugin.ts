import type { IAlert } from './types';

/**
 * Plugin System for AI Monitor
 *
 * Provides lifecycle hooks so external code can extend
 * the monitor without modifying core internals.
 *
 * Usage:
 *   monitor.use({ name: 'my-plugin', onAlert: (a) => { ... return a; } });
 */

// Forward-reference — we import the class type only for signatures
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IAIMonitorRef {
  alert(alert: IAlert): Promise<void>;
  notify(message: string): Promise<void>;
}

export interface IPlugin {
  /** Unique name for this plugin */
  name: string;

  /** Called when the plugin is registered via monitor.use() */
  onInit?(monitor: IAIMonitorRef): void | Promise<void>;

  /** Called when the monitor starts */
  onStart?(monitor: IAIMonitorRef): void | Promise<void>;

  /** Called when the monitor stops */
  onStop?(monitor: IAIMonitorRef): void | Promise<void>;

  /**
   * Called before an alert is sent. Can mutate or replace the alert.
   * Return the (possibly modified) alert to continue, or null to suppress it.
   */
  onAlert?(alert: IAlert, monitor: IAIMonitorRef): IAlert | null | Promise<IAlert | null>;

  /**
   * Called just before notifiers fire. Return false to suppress notification.
   */
  onBeforeNotify?(alert: IAlert): boolean | Promise<boolean>;
}

export class PluginManager {
  private plugins: IPlugin[] = [];

  /**
   * Register a plugin and call its onInit hook.
   */
  async register(plugin: IPlugin, monitor: IAIMonitorRef): Promise<void> {
    this.plugins.push(plugin);
    if (plugin.onInit) {
      await plugin.onInit(monitor);
    }
  }

  /**
   * Run a named lifecycle hook across all plugins.
   */
  async runHook(hook: 'onStart' | 'onStop', monitor: IAIMonitorRef): Promise<void> {
    for (const plugin of this.plugins) {
      const fn = plugin[hook];
      if (fn) {
        await fn.call(plugin, monitor);
      }
    }
  }

  /**
   * Run the alert pipeline: onAlert → onBeforeNotify.
   * Returns the final alert, or null if any plugin suppressed it.
   */
  async processAlert(alert: IAlert, monitor: IAIMonitorRef): Promise<IAlert | null> {
    let current: IAlert | null = alert;

    // Run through onAlert hooks (can mutate or suppress)
    for (const plugin of this.plugins) {
      if (!current) break;
      if (plugin.onAlert) {
        current = await plugin.onAlert(current, monitor);
      }
    }
    if (!current) return null;

    // Run through onBeforeNotify hooks (can suppress)
    for (const plugin of this.plugins) {
      if (plugin.onBeforeNotify) {
        const shouldContinue = await plugin.onBeforeNotify(current);
        if (!shouldContinue) return null;
      }
    }

    return current;
  }

  /**
   * Retrieve a plugin by name.
   */
  getPlugin(name: string): IPlugin | undefined {
    return this.plugins.find((p) => p.name === name);
  }

  /**
   * Number of registered plugins.
   */
  get count(): number {
    return this.plugins.length;
  }
}
