// Mock import.meta for Jest environment
if (typeof globalThis !== 'undefined') {
  // For all environments (Node.js and browser-like in Jest)
  Object.defineProperty(globalThis, 'import', {
    value: {
      meta: {
        env: {
          VITE_API_URL: 'http://localhost:8080',
          VITE_API_BASE_URL: 'http://localhost:8080',
          VITE_ANALYTICS_API_URL: 'http://localhost:8081/api/v1',
          MODE: 'test',
          DEV: true,
          VITE_FEATURE_TRACKING: 'true',
          VITE_FEATURE_REWARDS: 'true',
          VITE_FEATURE_ANALYTICS: 'true'
        }
      }
    },
    writable: false
  });
}

// Add TextEncoder and TextDecoder polyfills for React Router tests
class TextEncoderPolyfill {
  encode(string) {
    const codeUnits = new Uint8Array(string.length);
    for (let i = 0; i < string.length; i++) {
      codeUnits[i] = string.charCodeAt(i);
    }
    return codeUnits;
  }
}

class TextDecoderPolyfill {
  decode(uint8Array) {
    return String.fromCharCode.apply(null, uint8Array);
  }
}

globalThis.TextEncoder = globalThis.TextEncoder || TextEncoderPolyfill;
globalThis.TextDecoder = globalThis.TextDecoder || TextDecoderPolyfill;

// Setup other global mocks or configurations needed for tests

// Mock localStorage
if (typeof window !== 'undefined') {
  // For browser-like environment in Jest
  const localStorageMock = (function() {
    let store = {};
    return {
      getItem: function(key) {
        return store[key] || null;
      },
      setItem: function(key, value) {
        store[key] = String(value);
      },
      removeItem: function(key) {
        delete store[key];
      },
      clear: function() {
        store = {};
      }
    };
  })();
  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Prevent import.meta errors in test environment
jest.mock('./src/services/apiClient', () => {
  const axios = require('axios');
  return {
    apiClient: axios.create({
      baseURL: 'http://localhost:8081/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  };
}, { virtual: true });