import '@testing-library/jest-dom';

declare global {
  const jest: {
    fn: <T = unknown>() => jest.Mock<T>;
    mock: (moduleName: string, factory?: () => unknown) => unknown;
    resetAllMocks: () => void;
    clearAllMocks: () => void;
  };

  namespace jest {
    interface Mock<T = unknown> {
      mockResolvedValueOnce: (value: T) => Mock<T>;
      mockRejectedValueOnce: (reason: unknown) => Mock<T>;
      mockImplementation: (fn: (...args: unknown[]) => unknown) => Mock<T>;
    }
  }

  const describe: (name: string, fn: () => void) => void;
  const test: (name: string, fn: (...args: unknown[]) => unknown, timeout?: number) => void;
  const beforeEach: (fn: () => unknown) => void;
  const expect: unknown;
  const global: {
    fetch: unknown;
  };
}

export {};