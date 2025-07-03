import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

// Get API from environment variable
const API_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';
const API_NAME = __ENV.API_NAME || 'Unknown';

// Test data
const testUser = {
  name: 'Load Test User',
  email: `test-${Date.now()}-${Math.random()}@example.com`,
  age: 30,
  city: 'Bangkok'
};

export default function () {
  console.log(`Testing ${API_NAME} API at ${API_URL}`);

  // Test 1: Health check
  let response = http.get(`${API_URL}/health`);
  check(response, {
    [`${API_NAME} health check status is 200`]: (r) => r.status === 200,
  });

  // Test 2: Get users (simple query)
  response = http.get(`${API_URL}/users?limit=10&offset=0`);
  check(response, {
    [`${API_NAME} get users status is 200`]: (r) => r.status === 200,
    [`${API_NAME} get users response has data`]: (r) => JSON.parse(r.body).length > 0,
  });

  // Test 3: Complex query - Orders with users
  response = http.get(`${API_URL}/orders-with-users?limit=10`);
  check(response, {
    [`${API_NAME} orders with users status is 200`]: (r) => r.status === 200,
  });

  // Test 4: Complex query - User order summary
  response = http.get(`${API_URL}/user-order-summary?limit=10`);
  check(response, {
    [`${API_NAME} user order summary status is 200`]: (r) => r.status === 200,
  });

  // Test 5: Complex query - Analytics
  response = http.get(`${API_URL}/analytics`);
  check(response, {
    [`${API_NAME} analytics status is 200`]: (r) => r.status === 200,
  });

  // Test 6: CRUD operations
  // Create
  response = http.post(`${API_URL}/users`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, {
    [`${API_NAME} create user status is 201`]: (r) => r.status === 201,
  });

  if (response.status === 201) {
    const createdUser = JSON.parse(response.body);

    // Read
    response = http.get(`${API_URL}/users/${createdUser.id}`);
    check(response, {
      [`${API_NAME} get user status is 200`]: (r) => r.status === 200,
    });

    // Update
    const updateData = { ...testUser, age: 35 };
    response = http.put(`${API_URL}/users/${createdUser.id}`, JSON.stringify(updateData), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(response, {
      [`${API_NAME} update user status is 200`]: (r) => r.status === 200,
    });

    // Delete
    response = http.del(`${API_URL}/users/${createdUser.id}`);
    check(response, {
      [`${API_NAME} delete user status is 200`]: (r) => r.status === 200,
    });
  }

  sleep(1);
} 