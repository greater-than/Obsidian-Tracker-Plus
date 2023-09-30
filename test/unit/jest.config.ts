import type { Config } from 'jest';

export default async (): Promise<Config> => ({
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../../src',
  roots: ['../test', '../src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../.coverage',
  testEnvironment: 'node',
  globalSetup: '../test/unit/global-setup.ts',
  globalTeardown: '../test/unit/global-teardown.ts',
});
