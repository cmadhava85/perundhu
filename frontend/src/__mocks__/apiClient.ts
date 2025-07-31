import axios from 'axios';

// Mock apiClient implementation that's compatible with Jest tests
export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  }
});