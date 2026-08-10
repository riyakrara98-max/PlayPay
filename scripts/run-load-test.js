const http = require('http');

async function sendRequest(options, body = null) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        resolve({
          status: res.statusCode,
          durationMs,
          body,
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      resolve({
        status: 0,
        durationMs,
        error: err.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      resolve({
        status: 408,
        durationMs,
        error: 'Timeout',
      });
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runConcurrencyLevel(concurrency, totalRequests, path, method = 'GET', headers = {}, body = null) {
  const results = [];
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });

  const url = new URL(path, 'http://localhost:3000');
  const reqOptions = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname + url.search,
    method,
    headers: {
      'User-Agent': 'LoadTester/1.0',
      ...headers,
    },
    agent,
  };

  const pool = Array.from({ length: concurrency });
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const res = await sendRequest(reqOptions, body);
      results.push(res);
    }
  }

  await Promise.all(pool.map(() => worker()));
  agent.destroy();

  // Process stats
  const statuses = {};
  let totalDuration = 0;
  const durations = [];
  let timeouts = 0;

  for (const r of results) {
    statuses[r.status] = (statuses[r.status] || 0) + 1;
    durations.push(r.durationMs);
    totalDuration += r.durationMs;
    if (r.status === 408 || r.error === 'Timeout') timeouts++;
  }

  durations.sort((a, b) => a - b);

  const count = results.length;
  const avg = count > 0 ? (totalDuration / count).toFixed(1) : 0;
  const p50 = count > 0 ? durations[Math.floor(count * 0.5)].toFixed(1) : 0;
  const p95 = count > 0 ? durations[Math.floor(count * 0.95)].toFixed(1) : 0;
  const p99 = count > 0 ? durations[Math.min(count - 1, Math.floor(count * 0.99))].toFixed(1) : 0;

  return {
    concurrency,
    totalRequests: count,
    statuses,
    avgMs: avg,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    timeouts,
    success2xx: Object.keys(statuses).filter(s => s >= 200 && s < 300).reduce((a, b) => a + statuses[b], 0),
    client4xx: Object.keys(statuses).filter(s => s >= 400 && s < 500 && s != 429).reduce((a, b) => a + statuses[b], 0),
    rateLimit429: statuses[429] || 0,
    server5xx: Object.keys(statuses).filter(s => s >= 500).reduce((a, b) => a + statuses[b], 0),
  };
}

async function main() {
  console.log('====================================================');
  console.log('STARTING PLAYPAY PHASE 4 REAL CONCURRENCY LOAD TEST');
  console.log('====================================================');

  const levels = [
    { concurrency: 10, total: 30 },
    { concurrency: 25, total: 75 },
    { concurrency: 50, total: 100 },
    { concurrency: 100, total: 200 },
    { concurrency: 150, total: 300 },
    { concurrency: 200, total: 400 },
  ];

  console.log('\n--- 1. HTTP ENDPOINT LOAD TEST (GET /) ---');
  for (const l of levels) {
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    const res = await runConcurrencyLevel(l.concurrency, l.total, '/');
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[Level ${l.concurrency} Users] Req: ${res.totalRequests} | 2xx: ${res.success2xx} | 4xx: ${res.client4xx} | 429: ${res.rateLimit429} | 5xx: ${res.server5xx} | P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | P99: ${res.p99Ms}ms | Timeouts: ${res.timeouts} | MemDelta: ${(memAfter - memBefore).toFixed(2)}MB`);
  }

  console.log('\n--- 2. DASHBOARD ENDPOINT LOAD TEST (GET /dashboard) ---');
  for (const l of [10, 50, 100, 200]) {
    const res = await runConcurrencyLevel(l, l * 2, '/dashboard');
    console.log(`[Level ${l} Users] Req: ${res.totalRequests} | 2xx: ${res.success2xx} | 4xx: ${res.client4xx} | 429: ${res.rateLimit429} | 5xx: ${res.server5xx} | P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms`);
  }

  console.log('\n--- 3. MY TASKS ENDPOINT LOAD TEST (GET /my-tasks) ---');
  for (const l of [10, 50, 100, 200]) {
    const res = await runConcurrencyLevel(l, l * 2, '/my-tasks');
    console.log(`[Level ${l} Users] Req: ${res.totalRequests} | 2xx: ${res.success2xx} | 4xx: ${res.client4xx} | 429: ${res.rateLimit429} | 5xx: ${res.server5xx} | P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms`);
  }

  console.log('\n--- 4. UPLOAD SECURITY & RATE LIMIT LOAD TEST (POST /api/upload) ---');
  // Send 15 rapid upload requests with authorization headers to verify 401 & 429 enforcement
  const uploadRes = await runConcurrencyLevel(15, 15, '/api/upload', 'POST', {
    'content-type': 'application/json',
  }, JSON.stringify({ filename: 'test.jpg' }));
  console.log(`[Upload Auth/RateLimit Test] Req: ${uploadRes.totalRequests} | 401 (UnAuth): ${uploadRes.client4xx} | 429 (RateLimit): ${uploadRes.rateLimit429} | 5xx: ${uploadRes.server5xx}`);

  console.log('\n--- 5. PLAYSTORE API BURST TEST (POST /api/playstore) ---');
  const playstoreRes = await runConcurrencyLevel(20, 40, '/api/playstore', 'POST', {
    'content-type': 'application/json',
  }, JSON.stringify({ appId: 'com.whatsapp' }));
  console.log(`[PlayStore API Test] Req: ${playstoreRes.totalRequests} | 2xx/4xx: ${playstoreRes.success2xx + playstoreRes.client4xx} | 429: ${playstoreRes.rateLimit429} | 5xx: ${playstoreRes.server5xx} | P50: ${playstoreRes.p50Ms}ms | P95: ${playstoreRes.p95Ms}ms`);

  console.log('\n====================================================');
  console.log('PLAYPAY PHASE 4 CONCURRENCY TEST COMPLETED');
  console.log('====================================================');
}

main().catch(console.error);
