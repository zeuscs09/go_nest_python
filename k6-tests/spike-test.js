import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const recoveryTime = new Trend('recovery_time');

export let options = {
  // Spike Test - Test sudden traffic spikes
  stages: [
    { duration: '2m', target: 10 },   // Normal load
    { duration: '10s', target: 500 }, // Sudden spike to 500 users!
    { duration: '3m', target: 500 },  // Stay at spike level
    { duration: '10s', target: 10 },  // Drop back to normal
    { duration: '3m', target: 10 },   // Recovery period
    { duration: '10s', target: 200 }, // Another spike
    { duration: '2m', target: 200 },  // Hold spike
    { duration: '10s', target: 0 },   // Complete shutdown
  ],
  
  thresholds: {
    'http_req_duration': ['p(99)<2000'], // 99% under 2s during spikes
    'http_req_failed': ['rate<0.15'],    // Allow 15% error rate during spikes
    'checks': ['rate>0.80'],             // 80% success rate
  },
};

const APIS = {
  'golang': {
    baseUrl: 'http://localhost:8081',
    healthEndpoint: '/api/v1/health',
    priority: 1 // Higher priority
  },
  'nestjs': {
    baseUrl: 'http://localhost:3000', 
    healthEndpoint: '/api/v1/health',
    priority: 1
  },
  'python': {
    baseUrl: 'http://localhost:8000',
    healthEndpoint: '/',
    priority: 2 // Lower priority during spikes
  },
  'dotnet': {
    baseUrl: 'http://localhost:5001',
    healthEndpoint: '/health',
    priority: 1
  }
};

export default function () {
  const startTime = Date.now();
  
  // Select API based on priority during high load
  const vuCount = __ENV.K6_VUS || 10;
  let selectedApi;
  
  if (parseInt(vuCount) > 300) {
    // During spike, prefer high-priority APIs
    const highPriorityApis = Object.entries(APIS)
      .filter(([name, config]) => config.priority === 1)
      .map(([name]) => name);
    selectedApi = highPriorityApis[Math.floor(Math.random() * highPriorityApis.length)];
  } else {
    // Normal load distribution
    const apiKeys = Object.keys(APIS);
    selectedApi = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  }
  
  const api = APIS[selectedApi];
  
  // Run spike test scenario
  runSpikeScenario(api, selectedApi);
  
  recoveryTime.add(Date.now() - startTime);
  
  // Shorter sleep during spikes
  const sleepTime = parseInt(vuCount) > 300 ? Math.random() * 0.5 : Math.random() * 1;
  sleep(sleepTime);
}

function runSpikeScenario(api, apiName) {
  try {
    // During spikes, focus on critical endpoints
    const scenarios = [
      () => testCriticalPath(api, apiName),     // 60% weight
      () => testHealth(api, apiName),           // 30% weight  
      () => testBasicUsers(api, apiName),       // 10% weight
    ];
    
    const weights = [0.6, 0.3, 0.1];
    const rand = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (rand <= cumulativeWeight) {
        scenarios[i]();
        break;
      }
    }
    
  } catch (error) {
    errorRate.add(1);
    console.error(`Spike test error for ${apiName}: ${error}`);
  }
}

function testCriticalPath(api, apiName) {
  // Test the most critical user path during spikes
  const response = http.get(`${api.baseUrl}${api.healthEndpoint}`, {
    timeout: '5s',
  });
  
  const success = check(response, {
    [`${apiName} - Critical path available`]: (r) => r.status === 200,
    [`${apiName} - Critical path fast`]: (r) => r.timings.duration < 1000,
  });
  
  if (!success) errorRate.add(1);
}

function testHealth(api, apiName) {
  const response = http.get(`${api.baseUrl}${api.healthEndpoint}`, {
    timeout: '3s',
  });
  
  const success = check(response, {
    [`${apiName} - Health during spike`]: (r) => r.status === 200,
  });
  
  if (!success) errorRate.add(1);
}

function testBasicUsers(api, apiName) {
  const response = http.get(`${api.baseUrl}/api/v1/users?limit=5`, {
    timeout: '10s', // Longer timeout during spikes
  });
  
  const success = check(response, {
    [`${apiName} - Basic users during spike`]: (r) => r.status === 200 || r.status === 503,
  });
  
  if (!success) errorRate.add(1);
}

export function handleSummary(data) {
  const spikeResults = {
    peakUsers: 500,
    spikeErrorRate: data.metrics.errors?.values.rate || 0,
    recoveryTimeP95: data.metrics.recovery_time?.values['p(95)'] || 0,
    httpSuccessRate: 1 - (data.metrics.http_req_failed?.values.rate || 0),
  };
  
  return {
    'spike-test-results.json': JSON.stringify({...data, spikeResults}, null, 2),
    stdout: `
⚡ SPIKE TEST RESULTS ⚡

🎯 Spike Performance:
• Peak Users: 500
• HTTP Success Rate: ${(spikeResults.httpSuccessRate * 100).toFixed(2)}%
• Spike Error Rate: ${(spikeResults.spikeErrorRate * 100).toFixed(2)}%
• Recovery Time P95: ${spikeResults.recoveryTimeP95.toFixed(2)}ms

📊 Response Times:
• Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
• P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
• P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

${spikeResults.httpSuccessRate < 0.8 ? '⚠️  SYSTEM STRUGGLED WITH SPIKES!' : '✅ System handled spikes well'}
${data.metrics.http_req_duration.values['p(99)'] > 2000 ? '⚠️  SLOW RECOVERY DETECTED!' : '✅ Fast recovery from spikes'}
`,
  };
} 