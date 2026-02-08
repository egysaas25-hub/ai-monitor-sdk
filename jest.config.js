/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  moduleNameMapper: {
    '^@aker/ai-monitor-core$': '<rootDir>/packages/ai-monitor-core/src',
    '^@aker/ai-monitor-notifiers$': '<rootDir>/packages/ai-monitor-notifiers/src',
    '^@aker/ai-monitor-instrumentation$': '<rootDir>/packages/ai-monitor-instrumentation/src',
  },
};
