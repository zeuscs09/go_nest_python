import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

// Test data
const testUser = {
  name: 'Load Test User',
  email: `test-${Date.now()}-${Math.random()}@example.com`,
  age: 30,
  city: 'Bangkok'
};

export default function () {
  const apis = [
    'http://localhost:8081/api/v1',  // Golang
    'http://localhost:3000/api/v1',  // NestJS
    'http://localhost:8000/api/v1',  // Python
  ];

  // Select random API
  const baseUrl = apis[Math.floor(Math.random() * apis.length)];

  // Test 1: Health check
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Test 2: Get users
  response = http.get(`${baseUrl}/users?limit=10&offset=0`);
  check(response, {
    'get users status is 200': (r) => r.status === 200,
    'get users response has data': (r) => JSON.parse(r.body).length > 0,
  });

  // Test 3: Create user
  response = http.post(`${baseUrl}/users`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, {
    'create user status is 201': (r) => r.status === 201,
    'create user returns user data': (r) => JSON.parse(r.body).id !== undefined,
  });

  const createdUser = JSON.parse(response.body);

  // Test 4: Get specific user
  response = http.get(`${baseUrl}/users/${createdUser.id}`);
  check(response, {
    'get user status is 200': (r) => r.status === 200,
    'get user returns correct user': (r) => JSON.parse(r.body).id === createdUser.id,
  });

  // Test 5: Update user
  const updateData = { ...testUser, age: 35 };
  response = http.put(`${baseUrl}/users/${createdUser.id}`, JSON.stringify(updateData), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, {
    'update user status is 200': (r) => r.status === 200,
  });

  // Test 6: Complex queries
  response = http.get(`${baseUrl}/orders-with-users?limit=5`);
  check(response, {
    'orders with users status is 200': (r) => r.status === 200,
  });

  response = http.get(`${baseUrl}/user-order-summary?limit=5`);
  check(response, {
    'user order summary status is 200': (r) => r.status === 200,
  });

  response = http.get(`${baseUrl}/analytics`);
  check(response, {
    'analytics status is 200': (r) => r.status === 200,
  });

  // Test 7: Delete user
  response = http.del(`${baseUrl}/users/${createdUser.id}`);
  check(response, {
    'delete user status is 200': (r) => r.status === 200,
  });

  sleep(1);
} 