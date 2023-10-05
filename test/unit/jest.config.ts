import type { Config } from 'jest';

export default async (): Promise<Config> => ({
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../../',
  testRegex: '.*\\.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!**/*index.(t|j)s',
    '!**/*types.(t|j)s',
    '!**/*enums.(t|j)s',
  ],
  coveragePathIgnorePatterns: ['./node_modules'],
  coverageDirectory: './.coverage',
  coverageThreshold: {
    global: {
      branches: 1.5,
      functions: 4,
      lines: 3,
      statements: 3.25,
    },
  },
  testEnvironment: 'node',
  globalSetup: './test/unit/global-setup.ts',
  globalTeardown: './test/unit/global-teardown.ts',
});
