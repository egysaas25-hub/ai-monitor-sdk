import { LogAggregator } from '../log-aggregator';

describe('LogAggregator', () => {
  let agg: LogAggregator;

  beforeEach(() => {
    agg = new LogAggregator(100); // Small buffer for tests
  });

  afterEach(() => {
    agg.restoreConsole(); // Safety cleanup
  });

  describe('capture()', () => {
    it('adds entries to the buffer', () => {
      agg.capture('info', 'Hello');
      agg.capture('error', 'Oops');

      expect(agg.size).toBe(2);
    });

    it('stores level, message, and timestamp', () => {
      agg.capture('warn', 'Careful', { key: 'value' });

      const logs = agg.toJSON();
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Careful');
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].meta).toEqual({ key: 'value' });
    });
  });

  describe('ring buffer', () => {
    it('drops oldest entries when max is exceeded', () => {
      const small = new LogAggregator(3);
      small.capture('info', 'A');
      small.capture('info', 'B');
      small.capture('info', 'C');
      small.capture('info', 'D'); // Should drop A

      expect(small.size).toBe(3);
      expect(small.toJSON()[0].message).toBe('B');
    });
  });

  describe('interceptConsole()', () => {
    it('captures console.log/warn/error/debug', () => {
      const originalLog = console.log;

      agg.interceptConsole();

      console.log('test log');
      console.warn('test warn');
      console.error('test error');

      agg.restoreConsole();

      const logs = agg.toJSON();
      expect(logs.length).toBe(3);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('test log');
      expect(logs[1].level).toBe('warn');
      expect(logs[2].level).toBe('error');

      // Ensure original console is restored
      expect(console.log).toBe(originalLog);
    });

    it('is idempotent (double intercept)', () => {
      agg.interceptConsole();
      agg.interceptConsole(); // Should not double-wrap
      agg.restoreConsole();
    });
  });

  describe('query()', () => {
    beforeEach(() => {
      agg.capture('info', 'Info message');
      agg.capture('warn', 'Warning message');
      agg.capture('error', 'Error message');
      agg.capture('error', 'Another error');
    });

    it('returns all entries by default', () => {
      expect(agg.query().length).toBe(4);
    });

    it('filters by level', () => {
      const errors = agg.query({ levels: ['error'] });
      expect(errors.length).toBe(2);
      expect(errors.every((e) => e.level === 'error')).toBe(true);
    });

    it('filters by search pattern', () => {
      const results = agg.query({ search: 'another' });
      expect(results.length).toBe(1);
      expect(results[0].message).toBe('Another error');
    });

    it('limits results', () => {
      const results = agg.query({ limit: 2 });
      expect(results.length).toBe(2);
    });

    it('filters by time range', () => {
      const future = new Date(Date.now() + 10_000);
      const results = agg.query({ since: future });
      expect(results.length).toBe(0);
    });
  });

  describe('getRecentErrors()', () => {
    it('returns only error-level entries', () => {
      agg.capture('info', 'ok');
      agg.capture('error', 'bad');
      agg.capture('error', 'worse');

      const errors = agg.getRecentErrors();
      expect(errors.length).toBe(2);
      expect(errors.every((e) => e.level === 'error')).toBe(true);
    });
  });

  describe('clear()', () => {
    it('empties the buffer', () => {
      agg.capture('info', 'X');
      agg.clear();
      expect(agg.size).toBe(0);
    });
  });
});
