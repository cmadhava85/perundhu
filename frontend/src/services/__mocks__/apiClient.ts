import axios from 'axios';

// Mock apiClient implementation that's compatible with Jest tests
const mockApiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add mock interceptors for testing
mockApiClient.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

mockApiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export const apiClient = mockApiClient;