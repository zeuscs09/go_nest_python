import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for each API
const golangMetrics = {
  errorRate: new Rate('golang_errors'),
  responseTime: new Trend('golang_response_time'),
  requestCount: new Counter('golang_requests'),
};

const nestjsMetrics = {
  errorRate: new Rate('nestjs_errors'),
  responseTime: new Trend('nestjs_response_time'),
  requestCount: new Counter('nestjs_requests'),
};

const pythonMetrics = {
  errorRate: new Rate('python_errors'),
  responseTime: new Trend('python_response_time'),
  requestCount: new Counter('python_requests'),
};

const dotnetMetrics = {
  errorRate: new Rate('dotnet_errors'),
  responseTime: new Trend('dotnet_response_time'),
  requestCount: new Counter('dotnet_requests'),
};

export let options = {
  // Benchmark Test - Equal load for comparison
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '3m', target: 50 },   // Steady load
    { duration: '1m', target: 0 },    // Cool down
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<200'], // Strict threshold for comparison
    'http_req_failed': ['rate<0.01'],   // Very low error rate expected
    'checks': ['rate>0.95'],            // High success rate
  },
};

const APIS = {
  'golang': {
    baseUrl: 'http://localhost:8081',
    healthEndpoint: '/api/v1/health',
    metrics: golangMetrics,
    color: '🟢'
  },
  'nestjs': {
    baseUrl: 'http://localhost:3000', 
    healthEndpoint: '/api/v1/health',
    metrics: nestjsMetrics,
    color: '🔴'
  },
  'python': {
    baseUrl: 'http://localhost:8000',
    healthEndpoint: '/',
    metrics: pythonMetrics,
    color: '🟡'
  },
  'dotnet': {
    baseUrl: 'http://localhost:5001',
    healthEndpoint: '/health',
    metrics: dotnetMetrics,
    color: '🔵'
  }
};

// Test scenarios for fair comparison
const scenarios = [
  { name: 'health_check', weight: 30 },      // 30% of requests
  { name: 'user_list', weight: 40 },         // 40% of requests
  { name: 'user_create', weight: 20 },       // 20% of requests
  { name: 'analytics', weight: 10 },         // 10% of requests
];

export default function () {
  // Round-robin API selection for fair comparison
  const vuId = __VU - 1;
  const apiKeys = Object.keys(APIS);
  const selectedApi = apiKeys[vuId % apiKeys.length];
  const api = APIS[selectedApi];
  
  // Weighted scenario selection
  const rand = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedScenario = 'health_check';
  
  for (const scenario of scenarios) {
    cumulativeWeight += scenario.weight;
    if (rand <= cumulativeWeight) {
      selectedScenario = scenario.name;
      break;
    }
  }
  
  // Execute scenario with timing
  const startTime = Date.now();
  const result = executeScenario(selectedScenario, api, selectedApi);
  const duration = Date.now() - startTime;
  
  // Record metrics
  api.metrics.requestCount.add(1);
  api.metrics.responseTime.add(duration);
  
  if (!result.success) {
    api.metrics.errorRate.add(1);
  }
  
  // Realistic user behavior
  sleep(Math.random() * 1 + 0.5);
}

function executeScenario(scenario, api, apiName) {
  switch (scenario) {
    case 'health_check':
      return testHealthCheck(api, apiName);
    case 'user_list':
      return testUserList(api, apiName);
    case 'user_create':
      return testUserCreate(api, apiName);
    case 'analytics':
      return testAnalytics(api, apiName);
    default:
      return { success: false };
  }
}

function testHealthCheck(api, apiName) {
  const response = http.get(`${api.baseUrl}${api.healthEndpoint}`, {
    tags: { api: apiName, scenario: 'health_check' },
  });
  
  const success = check(response, {
    [`${api.color} ${apiName} - Health check OK`]: (r) => r.status === 200,
    [`${api.color} ${apiName} - Health check fast`]: (r) => r.timings.duration < 100,
  });
  
  return { success };
}

function testUserList(api, apiName) {
  const response = http.get(`${api.baseUrl}/api/v1/users?limit=10&offset=0`, {
    tags: { api: apiName, scenario: 'user_list' },
  });
  
  const success = check(response, {
    [`${api.color} ${apiName} - User list OK`]: (r) => r.status === 200,
    [`${api.color} ${apiName} - User list has data`]: (r) => {
      try {
        const data = r.json();
        return Array.isArray(data) && data.length > 0;
      } catch { return false; }
    },
  });
  
  return { success };
}

function testUserCreate(api, apiName) {
  const userData = {
    name: `BenchUser_${Math.random().toString(36).substr(2, 8)}`,
    email: `bench${Date.now()}@test.com`,
    age: Math.floor(Math.random() * 30) + 20,
    city: 'TestCity'
  };
  
  const response = http.post(`${api.baseUrl}/api/v1/users`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
    tags: { api: apiName, scenario: 'user_create' },
  });
  
  const success = check(response, {
    [`${api.color} ${apiName} - User create OK`]: (r) => r.status === 201,
    [`${api.color} ${apiName} - User create returns ID`]: (r) => {
      try {
        return r.json().id > 0;
      } catch { return false; }
    },
  });
  
  return { success };
}

function testAnalytics(api, apiName) {
  const response = http.get(`${api.baseUrl}/api/v1/analytics`, {
    tags: { api: apiName, scenario: 'analytics' },
  });
  
  const success = check(response, {
    [`${api.color} ${apiName} - Analytics OK`]: (r) => r.status === 200,
    [`${api.color} ${apiName} - Analytics has timestamp`]: (r) => {
      try {
        const data = r.json();
        return data.timestamp !== undefined;
      } catch { return false; }
    },
  });
  
  return { success };
}

export function handleSummary(data) {
  // Calculate per-API metrics
  const apiResults = {};
  
  Object.keys(APIS).forEach(apiName => {
    const api = APIS[apiName];
    const metrics = api.metrics;
    
    apiResults[apiName] = {
      color: api.color,
      requests: data.metrics[`${apiName}_requests`]?.values.count || 0,
      avgResponseTime: data.metrics[`${apiName}_response_time`]?.values.avg || 0,
      p95ResponseTime: data.metrics[`${apiName}_response_time`]?.values['p(95)'] || 0,
      errorRate: (data.metrics[`${apiName}_errors`]?.values.rate || 0) * 100,
    };
  });
  
  // Generate comparison report
  const sortedApis = Object.entries(apiResults)
    .sort((a, b) => a[1].avgResponseTime - b[1].avgResponseTime);
  
  let report = `
🏆 API PERFORMANCE COMPARISON
============================

📊 BENCHMARK RESULTS (5 minutes, equal load):

`;

  sortedApis.forEach(([apiName, results], index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
    
    report += `${medal} #${rank} ${results.color} ${apiName.toUpperCase()}
   • Requests: ${results.requests}
   • Avg Response: ${results.avgResponseTime.toFixed(2)}ms
   • P95 Response: ${results.p95ResponseTime.toFixed(2)}ms
   • Error Rate: ${results.errorRate.toFixed(2)}%
   
`;
  });
  
  report += `
📈 PERFORMANCE ANALYSIS:
`;
  
  const fastest = sortedApis[0];
  const slowest = sortedApis[sortedApis.length - 1];
  
  report += `
• 🚀 FASTEST: ${fastest[1].color} ${fastest[0].toUpperCase()} (${fastest[1].avgResponseTime.toFixed(2)}ms avg)
• 🐌 SLOWEST: ${slowest[1].color} ${slowest[0].toUpperCase()} (${slowest[1].avgResponseTime.toFixed(2)}ms avg)
• 📊 SPEED DIFFERENCE: ${((slowest[1].avgResponseTime - fastest[1].avgResponseTime) / fastest[1].avgResponseTime * 100).toFixed(1)}%

`;

  // Overall test metrics
  report += `
🎯 OVERALL TEST METRICS:
• Total Requests: ${data.metrics.http_reqs.values.count}
• Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%
• Test Duration: ${Math.round(data.state.testRunDurationMs / 1000)} seconds
• Throughput: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s

`;

  // Recommendations
  report += `
🔍 RECOMMENDATIONS:
`;
  
  if (fastest[1].avgResponseTime < 10) {
    report += `• ✅ ${fastest[1].color} ${fastest[0].toUpperCase()} shows excellent performance for production use\n`;
  }
  
  if (slowest[1].avgResponseTime > 50) {
    report += `• ⚠️  ${slowest[1].color} ${slowest[0].toUpperCase()} may need optimization for high-load scenarios\n`;
  }
  
  sortedApis.forEach(([apiName, results]) => {
    if (results.errorRate > 1) {
      report += `• 🔧 ${results.color} ${apiName.toUpperCase()} has ${results.errorRate.toFixed(2)}% error rate - needs investigation\n`;
    }
  });
  
  return {
    'benchmark-comparison-results.json': JSON.stringify({
      ...data,
      apiComparison: apiResults,
      ranking: sortedApis.map(([name, results]) => ({ name, ...results }))
    }, null, 2),
    'benchmark-comparison-report.txt': report,
    stdout: report,
  };
} 