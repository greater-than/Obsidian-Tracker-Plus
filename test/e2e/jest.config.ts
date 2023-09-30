import type { Config } from 'jest';

export default async (): Promise<Config> => ({
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-setup.ts',
});
