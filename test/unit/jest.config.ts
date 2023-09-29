import { Config } from 'jest';

const config: Config = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../../src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*index.(t|j)s',
    '!**/enum/*.(t|j)s',
    '!**/mocks/**/*.(t|j)s',
    '!**/types/**/*.(t|j)s',
  ],
  coverageDirectory: '../.coverage',
  testEnvironment: 'node',
  globalSetup: '../test/unit/global-setup.ts',
  globalTeardown: '../test/unit/global-teardown.ts',
};

export default config;
