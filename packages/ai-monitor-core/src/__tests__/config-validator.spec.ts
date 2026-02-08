import { validateConfig } from '../config-validator';

describe('validateConfig', () => {
  it('valid config returns no errors', () => {
    const result = validateConfig({
      host: '127.0.0.1',
      port: 3333,
      enabled: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('empty config is valid (all optional)', () => {
    expect(validateConfig({}).valid).toBe(true);
  });

  // Port validation
  it('rejects port < 1', () => {
    const result = validateConfig({ port: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/port/i);
  });

  it('rejects port > 65535', () => {
    const result = validateConfig({ port: 99999 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/port/i);
  });

  it('rejects non-number port', () => {
    const result = validateConfig({ port: 'abc' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/port/i);
  });

  // Host validation
  it('rejects non-string host', () => {
    const result = validateConfig({ host: 123 as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/host/i);
  });

  // Enabled validation
  it('rejects non-boolean enabled', () => {
    const result = validateConfig({ enabled: 'yes' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/enabled/i);
  });

  // Notifier duck-type check
  it('rejects notifiers without sendAlert', () => {
    const result = validateConfig({ notifiers: [{ send: jest.fn() } as any] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/INotifier/i);
  });

  it('accepts valid notifier', () => {
    const n = {
      send: jest.fn(),
      sendAlert: jest.fn(),
      sendPipelineStatus: jest.fn(),
      sendDeploymentNotification: jest.fn(),
      sendDailyReport: jest.fn(),
    };
    expect(validateConfig({ notifiers: [n] }).valid).toBe(true);
  });

  // AI config
  it('rejects aiConfig.enabled without apiKey', () => {
    const result = validateConfig({ aiConfig: { enabled: true } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/apiKey/i);
  });

  // Deduplication
  it('rejects deduplication with cooldownMs <= 0', () => {
    const result = validateConfig({ deduplication: { enabled: true, cooldownMs: -1 } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/cooldownMs/i);
  });

  // Plugins
  it('rejects plugins without name', () => {
    const result = validateConfig({ plugins: [{ name: '' } as any] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/name/i);
  });

  // Multiple errors
  it('collects multiple errors', () => {
    const result = validateConfig({ port: -1, host: 123 as any, enabled: 'no' as any });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
