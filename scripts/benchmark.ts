import http from "http";

export async function runLoadTestBenchmark() {
  console.log("⚡ TriLedger AI High-Throughput Engine Benchmark Simulator");
  console.log("=================================================");
  console.log("Simulating 100+ Concurrent Virtual Financial Auditors...");

  const targetUrl = "http://localhost:3000";
  const endpoints = ["/healthz", "/ready", "/api/stats", "/docs"];
  
  const startTime = Date.now();
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies: number[] = [];

  const promises = [];

  // Fire 120 concurrent simulated virtual user calls across endpoints
  for (let i = 0; i < 120; i++) {
    const endpoint = endpoints[i % endpoints.length];
    
    const p = new Promise<void>((resolve) => {
      const reqStart = Date.now();
      totalRequests++;

      http.get(`${targetUrl}${endpoint}`, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          const duration = Date.now() - reqStart;
          latencies.push(duration);
          if (res.statusCode && res.statusCode < 400) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
          resolve();
        });
      }).on("error", (err) => {
        failedRequests++;
        resolve();
      });
    });

    promises.push(p);
  }

  await Promise.all(promises);
  const totalDurationMs = Date.now() - startTime;
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const rps = Math.round((totalRequests / (totalDurationMs / 1000)) * 10) / 10;

  console.log("\n📊 Benchmark Results Summary:");
  console.log(`- Total Requests Sent : ${totalRequests}`);
  console.log(`- Successful Responses : ${successfulRequests}`);
  console.log(`- Failed Responses     : ${failedRequests}`);
  console.log(`- Total Time Elapsed   : ${totalDurationMs} ms`);
  console.log(`- Throughput (RPS)     : ${rps} req/sec`);
  console.log(`- Avg Latency          : ${avgLatency} ms`);
  console.log("=================================================");
}

if (process.argv[1] && process.argv[1].includes("benchmark")) {
  runLoadTestBenchmark().catch(console.error);
}
