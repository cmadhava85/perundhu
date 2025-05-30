export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
    'react-i18next': '<rootDir>/src/__mocks__/react-i18next.ts',
    '^../utils/env$': '<rootDir>/src/__mocks__/utils/env.ts',
    '^./utils/environment$': '<rootDir>/src/__mocks__/utils/environment.ts',
    '^@/utils/environment$': '<rootDir>/src/__mocks__/utils/environment.ts',
    '\\./(.*)/utils/environment': '<rootDir>/src/__mocks__/utils/environment.ts',
    '/utils/environment': '<rootDir>/src/__mocks__/utils/environment.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)']
};