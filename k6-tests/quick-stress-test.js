import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  // Quick Stress Test - 5 minutes total
  stages: [
    { duration: '30s', target: 20 },  // Warm up
    { duration: '1m', target: 50 },   // Light load
    { duration: '1m', target: 100 },  // Medium load
    { duration: '1m', target: 150 },  // Heavy load
    { duration: '1m', target: 200 },  // Peak load
    { duration: '30s', target: 0 },   // Cool down
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<300'],
    'http_req_failed': ['rate<0.1'],
    'checks': ['rate>0.85'],
  },
};

const APIS = {
  'golang': 'http://localhost:8081',
  'nestjs': 'http://localhost:3000', 
  'python': 'http://localhost:8000',
  'dotnet': 'http://localhost:5001'
};

export default function () {
  const apiKeys = Object.keys(APIS);
  const selectedApi = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  const baseUrl = APIS[selectedApi];
  
  // Quick test scenarios
  const scenarios = ['health', 'users', 'analytics'];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  switch(scenario) {
    case 'health':
      testHealth(baseUrl, selectedApi);
      break;
    case 'users':
      testUsers(baseUrl, selectedApi);
      break;
    case 'analytics':
      testAnalytics(baseUrl, selectedApi);
      break;
  }
  
  sleep(Math.random() * 1 + 0.2);
}

function testHealth(baseUrl, apiName) {
  const endpoints = {
    'golang': '/api/v1/health',
    'nestjs': '/api/v1/health',
    'python': '/',
    'dotnet': '/health'
  };
  
  const response = http.get(`${baseUrl}${endpoints[apiName]}`);
  
  const success = check(response, {
    [`${apiName} - Health OK`]: (r) => r.status === 200,
  });
  
  if (!success) errorRate.add(1);
}

function testUsers(baseUrl, apiName) {
  const response = http.get(`${baseUrl}/api/v1/users?limit=10`);
  
  const success = check(response, {
    [`${apiName} - Users OK`]: (r) => r.status === 200,
  });
  
  if (!success) errorRate.add(1);
}

function testAnalytics(baseUrl, apiName) {
  const response = http.get(`${baseUrl}/api/v1/analytics`);
  
  const success = check(response, {
    [`${apiName} - Analytics OK`]: (r) => r.status === 200,
  });
  
  if (!success) errorRate.add(1);
} 