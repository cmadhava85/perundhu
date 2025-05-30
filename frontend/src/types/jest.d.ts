import '@testing-library/jest-dom';

declare global {
  const jest: {
    fn: <T = any>() => jest.Mock<T>;
    mock: (moduleName: string, factory?: any) => any;
    resetAllMocks: () => void;
    clearAllMocks: () => void;
  };

  namespace jest {
    interface Mock<T = any> {
      mockResolvedValueOnce: (value: T) => Mock<T>;
      mockRejectedValueOnce: (reason: any) => Mock<T>;
      mockImplementation: (fn: (...args: any[]) => any) => Mock<T>;
    }
  }

  const describe: (name: string, fn: () => void) => void;
  const test: (name: string, fn: (...args: any[]) => any, timeout?: number) => void;
  const beforeEach: (fn: () => any) => void;
  const expect: any;
  const global: {
    fetch: any;
  };
}

export {};