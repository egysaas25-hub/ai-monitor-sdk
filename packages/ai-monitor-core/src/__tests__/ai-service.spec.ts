import { AIService } from '../ai-service';

describe('AIService', () => {
  // ---- Disabled state -------------------------------------------------------

  describe('when disabled (no API key)', () => {
    let service: AIService;

    beforeEach(() => {
      // Suppress console.warn about missing API key
      jest.spyOn(console, 'warn').mockImplementation();
      service = new AIService({ enabled: true }); // no apiKey → disables itself
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns fallback analysis for analyzeLog', async () => {
      const result = await service.analyzeLog({
        timestamp: new Date(),
        level: 'ERROR',
        message: 'test error',
      });

      expect(result.severity).toBe('MEDIUM');
      expect(result.confidence).toBe(0);
      expect(result.suggestions).toContain('Enable AI analysis by providing an API key');
    });

    it('returns fallback analysis for analyzeLogs', async () => {
      const result = await service.analyzeLogs([
        { timestamp: new Date(), level: 'INFO', message: 'log 1' },
        { timestamp: new Date(), level: 'ERROR', message: 'log 2' },
      ]);

      expect(result.severity).toBe('MEDIUM');
      expect(result.summary).toBe('Multiple logs');
    });

    it('returns fallback analysis for analyzeMetrics', async () => {
      const result = await service.analyzeMetrics([{ name: 'cpu', value: 80, timestamp: new Date() }]);

      expect(result.severity).toBe('MEDIUM');
      expect(result.summary).toBe('Metrics analysis');
    });

    it('returns fallback analysis for analyzeError', async () => {
      const result = await service.analyzeError(new Error('test'));

      expect(result.severity).toBe('MEDIUM');
      expect(result.summary).toBe('test');
    });

    it('returns fallback for detectAnomalies', async () => {
      const result = await service.detectAnomalies([1, 2, 3]);
      expect(result.severity).toBe('MEDIUM');
    });

    it('returns fallback for suggestAutoHeal', async () => {
      const result = await service.suggestAutoHeal('disk full');
      expect(result.severity).toBe('MEDIUM');
      expect(result.summary).toBe('disk full');
    });
  });

  // ---- Construction ---------------------------------------------------------

  describe('construction', () => {
    it('creates with default config', () => {
      jest.spyOn(console, 'warn').mockImplementation();
      const service = new AIService();
      expect(service).toBeDefined();
      jest.restoreAllMocks();
    });

    it('uses environment variables when no config provided', () => {
      const originalKey = process.env.AI_API_KEY;
      process.env.AI_API_KEY = '';
      jest.spyOn(console, 'warn').mockImplementation();

      const service = new AIService();
      expect(service).toBeDefined();

      process.env.AI_API_KEY = originalKey;
      jest.restoreAllMocks();
    });

    it('disables when enabled is false', () => {
      const service = new AIService({ enabled: false });
      expect(service).toBeDefined();
    });
  });

  // ---- Fallback analysis structure ------------------------------------------

  describe('fallback analysis structure', () => {
    let service: AIService;

    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation();
      service = new AIService(); // disabled
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('has all required fields', async () => {
      const result = await service.analyzeLog({
        timestamp: new Date(),
        level: 'ERROR',
        message: 'check fields',
      });

      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('rootCause');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('isAnomaly');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('relatedPatterns');
      expect(result.isAnomaly).toBe(false);
      expect(result.relatedPatterns).toEqual([]);
    });
  });
});
