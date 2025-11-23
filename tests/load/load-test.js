import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Configuration
const baseUrl = __ENV.API_URL || 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],     // Error rate should be less than 10%
    errors: ['rate<0.1'],
  },
};

export default function () {
  // Test 1: Bus schedules endpoint
  const busSchedulesRes = http.get(`${baseUrl}/api/v1/bus-schedules`);
  
  const busSchedulesCheck = check(busSchedulesRes, {
    'bus-schedules status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'bus-schedules response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!busSchedulesCheck);
  apiResponseTime.add(busSchedulesRes.timings.duration);
  
  sleep(1);
  
  // Test 2: Locations endpoint
  const locationsRes = http.get(`${baseUrl}/api/v1/locations`);
  
  const locationsCheck = check(locationsRes, {
    'locations status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'locations response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!locationsCheck);
  apiResponseTime.add(locationsRes.timings.duration);
  
  sleep(1);
}

// Setup function - runs once before test
export function setup() {
  console.log(`Starting load test against: ${baseUrl}`);
  
  // Verify API is reachable
  const healthCheck = http.get(`${baseUrl}/api/v1/bus-schedules`);
  if (healthCheck.status === 0) {
    throw new Error('API is not reachable');
  }
  
  return { baseUrl };
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log(`Load test completed for: ${data.baseUrl}`);
}
