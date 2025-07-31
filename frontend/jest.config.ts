export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/setupTests.ts'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^.+/apiClient$': '<rootDir>/src/services/__mocks__/apiClient.ts',
    '^.+/analyticsService$': '<rootDir>/src/__mocks__/analyticsService.ts'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
    }],
    '^.+\\.js$': '<rootDir>/jest.transform.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|vite)/)'
  ],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  maxWorkers: '50%',
  testTimeout: 15000,
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};