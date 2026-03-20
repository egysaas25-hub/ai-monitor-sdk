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
    '^@momen124/ai-monitor-core$': '<rootDir>/packages/ai-monitor-core/src',
    '^@momen124/ai-monitor-notifiers$': '<rootDir>/packages/ai-monitor-notifiers/src',
    '^@momen124/ai-monitor-instrumentation$': '<rootDir>/packages/ai-monitor-instrumentation/src',
  },
};
