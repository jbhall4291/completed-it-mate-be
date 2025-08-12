// jest.config.js
const { createDefaultPreset } = require('ts-jest');
const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Make sure dist/ is ignored and we only look at src/
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.(ts|js)', '**/?(*.)+(spec|test).(ts|js)'],
  moduleFileExtensions: ['ts', 'js', 'json'],

  // ts-jest transform
  transform: {
    ...tsJestTransformCfg,
  },

  // Coverage settings (Codecov needs lcov)
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',         // don’t count test files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // Useful in CI to avoid resource contention (DB, ports, etc.)
  maxWorkers: 1,

  // Your existing test setup (keep this)
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],

  // Keep noise down in watch/CI mode
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
