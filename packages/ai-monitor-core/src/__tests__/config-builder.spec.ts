import { ConfigBuilder, createConfig } from '../config-builder';

describe('ConfigBuilder', () => {
  // ---- Fluent API -----------------------------------------------------------

  describe('fluent API', () => {
    it('builds config with all options', () => {
      const config = new ConfigBuilder()
        .host('127.0.0.1')
        .port(4444)
        .enabled(true)
        .enableHealthEndpoint(true)
        .enableAlertEndpoint(false)
        .enablePipelineEndpoint(false)
        .sendTestNotification(true, 1000)
        .build();

      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(4444);
      expect(config.enabled).toBe(true);
      expect(config.enableHealthEndpoint).toBe(true);
      expect(config.enableAlertEndpoint).toBe(false);
      expect(config.enablePipelineEndpoint).toBe(false);
      expect(config.sendTestNotification).toBe(true);
      expect(config.testNotificationDelay).toBe(1000);
    });

    it('returns empty config when no options set', () => {
      const config = new ConfigBuilder().build();
      expect(config).toEqual({});
    });

    it('returns this for chaining', () => {
      const builder = new ConfigBuilder();
      expect(builder.host('x')).toBe(builder);
      expect(builder.port(1)).toBe(builder);
      expect(builder.enabled(true)).toBe(builder);
    });
  });

  // ---- Notifiers ------------------------------------------------------------

  describe('notifiers', () => {
    it('addNotifier appends to array', () => {
      const n1 = { send: jest.fn() } as any;
      const n2 = { send: jest.fn() } as any;

      const config = new ConfigBuilder().addNotifier(n1).addNotifier(n2).build();

      expect(Array.isArray(config.notifiers)).toBe(true);
      expect((config.notifiers as any[]).length).toBe(2);
    });

    it('notifiers() replaces existing', () => {
      const n1 = { send: jest.fn() } as any;
      const n2 = { send: jest.fn() } as any;

      const config = new ConfigBuilder().addNotifier(n1).notifiers(n2).build();

      expect(config.notifiers).toBe(n2);
    });
  });

  // ---- Logger ---------------------------------------------------------------

  describe('logger', () => {
    it('sets custom logger', () => {
      const customLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
      const config = new ConfigBuilder().logger(customLogger).build();
      expect(config.logger).toBe(customLogger);
    });
  });

  // ---- Environment loading --------------------------------------------------

  describe('fromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('loads config from environment variables', () => {
      process.env.AI_MONITOR_HOST = '10.0.0.1';
      process.env.AI_MONITOR_PORT = '5555';
      process.env.AI_MONITOR_ENABLED = 'true';
      process.env.AI_MONITOR_SEND_TEST_NOTIFICATION = 'true';
      process.env.AI_MONITOR_TEST_NOTIFICATION_DELAY = '2000';

      const config = new ConfigBuilder({ fromEnv: true }).build();

      expect(config.host).toBe('10.0.0.1');
      expect(config.port).toBe(5555);
      expect(config.enabled).toBe(true);
      expect(config.sendTestNotification).toBe(true);
      expect(config.testNotificationDelay).toBe(2000);
    });

    it('supports custom env prefix', () => {
      process.env.CUSTOM_HOST = 'custom.host';
      process.env.CUSTOM_PORT = '6666';

      const config = new ConfigBuilder({ fromEnv: true, envPrefix: 'CUSTOM_' }).build();

      expect(config.host).toBe('custom.host');
      expect(config.port).toBe(6666);
    });

    it('defaults enabled to true when env is unset', () => {
      const config = new ConfigBuilder({ fromEnv: true }).build();
      expect(config.enabled).toBe(true);
    });
  });

  // ---- createConfig helper ---------------------------------------------------

  describe('createConfig()', () => {
    it('returns a ConfigBuilder instance', () => {
      const builder = createConfig();
      expect(builder).toBeInstanceOf(ConfigBuilder);
    });

    it('passes options through', () => {
      process.env.AI_MONITOR_PORT = '7777';
      const config = createConfig({ fromEnv: true }).build();
      expect(config.port).toBe(7777);
      delete process.env.AI_MONITOR_PORT;
    });
  });
});
