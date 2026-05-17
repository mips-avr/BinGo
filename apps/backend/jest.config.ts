import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/main.ts'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@bingo/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@bingo/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
