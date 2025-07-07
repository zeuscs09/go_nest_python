import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCounter = new Counter('requests_total');

export let options = {
  // Stress Test Stages
  stages: [
    // Warmup
    { duration: '1m', target: 10 },   // Start with 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    
    // Light Stress
    { duration: '3m', target: 100 },  // Increase to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    
    // Heavy Stress  
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    
    // Peak Stress (Breaking Point Test)
    { duration: '2m', target: 300 },  // Ramp up to 300 users
    { duration: '3m', target: 300 },  // Stay at 300 users
    { duration: '2m', target: 400 },  // Push to 400 users
    { duration: '3m', target: 400 },  // Stay at 400 users
    
    // Recovery Test
    { duration: '2m', target: 100 },  // Drop back to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    
    // Cool down
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  
  // Thresholds for stress testing
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.05'],   // Error rate should be less than 5%
    'errors': ['rate<0.05'],            // Custom error rate less than 5%
    'checks': ['rate>0.90'],            // 90% of checks should pass
  },
};

const APIS = {
  'golang': {
    baseUrl: 'http://localhost:8081',
    healthEndpoint: '/api/v1/health',
    weight: 25  // 25% of traffic
  },
  'nestjs': {
    baseUrl: 'http://localhost:3000', 
    healthEndpoint: '/api/v1/health',
    weight: 25  // 25% of traffic
  },
  'python': {
    baseUrl: 'http://localhost:8000',
    healthEndpoint: '/',
    weight: 25  // 25% of traffic
  },
  'dotnet': {
    baseUrl: 'http://localhost:5001',
    healthEndpoint: '/health',
    weight: 25  // 25% of traffic
  }
};

// Test scenarios with different complexity levels
const scenarios = [
  'simple_health_check',
  'user_operations', 
  'complex_analytics',
  'mixed_workload'
];

export default function () {
  requestCounter.add(1);
  
  // Randomly select API based on weight distribution
  const apiKeys = Object.keys(APIS);
  const selectedApi = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  const api = APIS[selectedApi];
  
  // Randomly select scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const startTime = Date.now();
  
  try {
    switch(scenario) {
      case 'simple_health_check':
        runHealthCheck(api, selectedApi);
        break;
      case 'user_operations':
        runUserOperations(api, selectedApi);
        break;
      case 'complex_analytics':
        runComplexAnalytics(api, selectedApi);
        break;
      case 'mixed_workload':
        runMixedWorkload(api, selectedApi);
        break;
    }
  } catch (error) {
    errorRate.add(1);
    console.error(`Error in ${scenario} for ${selectedApi}: ${error}`);
  }
  
  responseTime.add(Date.now() - startTime);
  
  // Random sleep to simulate real user behavior
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

function runHealthCheck(api, apiName) {
  const response = http.get(`${api.baseUrl}${api.healthEndpoint}`);
  
  const success = check(response, {
    [`${apiName} - Health check status is 200`]: (r) => r.status === 200,
    [`${apiName} - Health check response time < 100ms`]: (r) => r.timings.duration < 100,
  });
  
  if (!success) errorRate.add(1);
}

function runUserOperations(api, apiName) {
  // Get users
  let getUsersResponse = http.get(`${api.baseUrl}/api/v1/users?limit=20&offset=0`);
  let success1 = check(getUsersResponse, {
    [`${apiName} - Get users status is 200`]: (r) => r.status === 200,
    [`${apiName} - Get users has data`]: (r) => {
      try {
        const data = r.json();
        return Array.isArray(data) && data.length > 0;
      } catch { return false; }
    },
  });

  // Create user
  const userData = {
    name: `StressUser_${Math.random().toString(36).substr(2, 9)}`,
    email: `stress${Date.now()}@example.com`,
    age: Math.floor(Math.random() * 50) + 18,
    city: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'][Math.floor(Math.random() * 4)]
  };
  
  let createResponse = http.post(`${api.baseUrl}/api/v1/users`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  let success2 = check(createResponse, {
    [`${apiName} - Create user status is 201`]: (r) => r.status === 201,
    [`${apiName} - Create user returns ID`]: (r) => {
      try {
        return r.json().id > 0;
      } catch { return false; }
    },
  });
  
  if (!success1 || !success2) errorRate.add(1);
}

function runComplexAnalytics(api, apiName) {
  // Test all analytics endpoints
  const endpoints = [
    '/api/v1/analytics',
    '/api/v1/orders-with-users?limit=10',
    '/api/v1/user-order-summary?limit=10'
  ];
  
  let allSuccess = true;
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${api.baseUrl}${endpoint}`);
    const success = check(response, {
      [`${apiName} - ${endpoint} status is 200`]: (r) => r.status === 200,
      [`${apiName} - ${endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
      [`${apiName} - ${endpoint} has data`]: (r) => {
        try {
          const data = r.json();
          return data !== null && data !== undefined;
        } catch { return false; }
      },
    });
    
    if (!success) allSuccess = false;
  });
  
  if (!allSuccess) errorRate.add(1);
}

function runMixedWorkload(api, apiName) {
  // Simulate real user workflow
  
  // 1. Health check
  runHealthCheck(api, apiName);
  
  // Short delay
  sleep(0.1);
  
  // 2. Browse users
  const browseResponse = http.get(`${api.baseUrl}/api/v1/users?limit=5&offset=${Math.floor(Math.random() * 10)}`);
  check(browseResponse, {
    [`${apiName} - Browse users OK`]: (r) => r.status === 200,
  });
  
  // Short delay
  sleep(0.1);
  
  // 3. Maybe create a user (30% chance)
  if (Math.random() < 0.3) {
    const userData = {
      name: `MixedUser_${Math.random().toString(36).substr(2, 6)}`,
      email: `mixed${Date.now()}@test.com`,
      age: Math.floor(Math.random() * 40) + 20,
      city: 'TestCity'
    };
    
    http.post(`${api.baseUrl}/api/v1/users`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // 4. Maybe check analytics (20% chance)
  if (Math.random() < 0.2) {
    http.get(`${api.baseUrl}/api/v1/analytics`);
  }
}

// Summary function to log results
export function handleSummary(data) {
  return {
    'stress-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
🔥 STRESS TEST RESULTS 🔥

📊 Performance Summary:
• Total Requests: ${data.metrics.http_reqs.values.count}
• Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s
• Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
• 95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
• 99th Percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

🎯 Success Metrics:
• HTTP Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%
• Check Success Rate: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%
• Custom Error Rate: ${(data.metrics.errors?.values.rate * 100 || 0).toFixed(2)}%

📈 Load Profile:
• Peak VUs: 400
• Test Duration: ${Math.round(data.state.testRunDurationMs / 1000 / 60)} minutes
• Data Received: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB
• Data Sent: ${(data.metrics.data_sent.values.count / 1024 / 1024).toFixed(2)} MB

${data.metrics.http_req_failed.values.rate > 0.05 ? '⚠️  HIGH ERROR RATE DETECTED!' : '✅ Error rate within acceptable limits'}
${data.metrics.http_req_duration.values['p(95)'] > 500 ? '⚠️  HIGH RESPONSE TIMES DETECTED!' : '✅ Response times within acceptable limits'}
`,
  };
} 