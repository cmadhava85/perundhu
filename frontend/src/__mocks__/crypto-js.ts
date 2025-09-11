import { vi } from 'vitest';

// Mock CryptoJS
const CryptoJSMock = {
  SHA256: vi.fn((str) => ({
    toString: vi.fn(() => 'mocked-hash-' + str.slice(0, 10)),
  })),
  AES: {
    encrypt: vi.fn((data, _key) => ({
      toString: vi.fn(() => 'encrypted-' + data),
    })),
    decrypt: vi.fn((_encrypted, _key) => ({
      toString: vi.fn(() => 'decrypted-data'),
    })),
  },
  enc: {
    Utf8: {
      parse: vi.fn((str) => str),
      stringify: vi.fn((str) => str),
    },
  },
};

export default CryptoJSMock;