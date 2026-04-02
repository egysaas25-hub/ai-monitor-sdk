import { AIProvider } from '@momen124/ai-monitor-core';

describe('ai-monitor-ai basic setup', () => {
  it('should be able to import from core without errors', () => {
    // A simple sanity check that our internal TS references work
    const dummyProvider: Partial<AIProvider> = {
      name: 'TestProvider'
    };
    
    expect(dummyProvider.name).toBe('TestProvider');
  });
});
