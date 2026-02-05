import type { IMonitorConfig, IConfigBuilderOptions } from './types';

/**
 * Fluent configuration builder for AIMonitor
 * Makes setup intuitive and discoverable
 */
export class ConfigBuilder {
  private config: Partial<IMonitorConfig> = {};

  constructor(options: IConfigBuilderOptions = {}) {
    // If fromEnv is true, load from environment variables
    if (options.fromEnv) {
      this.loadFromEnv(options.envPrefix || 'AI_MONITOR_');
    }
  }

  /**
   * Set the server host
   */
  host(host: string): this {
    this.config.host = host;
    return this;
  }

  /**
   * Set the server port
   */
  port(port: number): this {
    this.config.port = port;
    return this;
  }

  /**
   * Enable or disable monitoring
   */
  enabled(enabled: boolean): this {
    this.config.enabled = enabled;
    return this;
  }

  /**
   * Add a notifier
   */
  addNotifier(notifier: any): this {
    if (!this.config.notifiers) {
      this.config.notifiers = [];
    }
    if (Array.isArray(this.config.notifiers)) {
      this.config.notifiers.push(notifier);
    } else {
      this.config.notifiers = [this.config.notifiers, notifier];
    }
    return this;
  }

  /**
   * Set notifiers (replaces existing)
   */
  notifiers(notifiers: any | any[]): this {
    this.config.notifiers = notifiers;
    return this;
  }

  /**
   * Set custom logger
   */
  logger(logger: any): this {
    this.config.logger = logger;
    return this;
  }

  /**
   * Enable health endpoint
   */
  enableHealthEndpoint(enable: boolean = true): this {
    this.config.enableHealthEndpoint = enable;
    return this;
  }

  /**
   * Enable alert endpoint
   */
  enableAlertEndpoint(enable: boolean = true): this {
    this.config.enableAlertEndpoint = enable;
    return this;
  }

  /**
   * Enable pipeline endpoint
   */
  enablePipelineEndpoint(enable: boolean = true): this {
    this.config.enablePipelineEndpoint = enable;
    return this;
  }

  /**
   * Send test notification on startup
   */
  sendTestNotification(send: boolean = true, delay?: number): this {
    this.config.sendTestNotification = send;
    if (delay !== undefined) {
      this.config.testNotificationDelay = delay;
    }
    return this;
  }

  /**
   * Build the configuration
   */
  build(): IMonitorConfig {
    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(prefix: string): void {
    const getEnv = (key: string, defaultValue?: string): string | undefined => {
      return process.env[prefix + key] || defaultValue;
    };

    const getBool = (key: string, defaultValue: boolean = false): boolean => {
      const value = getEnv(key);
      if (value === undefined) return defaultValue;
      return value.toLowerCase() === 'true';
    };

    const getNumber = (key: string, defaultValue?: number): number | undefined => {
      const value = getEnv(key);
      if (value === undefined) return defaultValue;
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : num;
    };

    // Load values
    const host = getEnv('HOST');
    if (host) this.config.host = host;

    const port = getNumber('PORT');
    if (port) this.config.port = port;

    const enabled = getBool('ENABLED', true);
    this.config.enabled = enabled;

    const enableHealth = getBool('ENABLE_HEALTH_ENDPOINT', true);
    this.config.enableHealthEndpoint = enableHealth;

    const enableAlert = getBool('ENABLE_ALERT_ENDPOINT', true);
    this.config.enableAlertEndpoint = enableAlert;

    const enablePipeline = getBool('ENABLE_PIPELINE_ENDPOINT', true);
    this.config.enablePipelineEndpoint = enablePipeline;

    const sendTest = getBool('SEND_TEST_NOTIFICATION', false);
    this.config.sendTestNotification = sendTest;

    const testDelay = getNumber('TEST_NOTIFICATION_DELAY');
    if (testDelay) this.config.testNotificationDelay = testDelay;
  }
}

/**
 * Create a new configuration builder
 */
export function createConfig(options?: IConfigBuilderOptions): ConfigBuilder {
  return new ConfigBuilder(options);
}
