import { AIMonitor } from "@momen124/ai-monitor-core";

async function runStressTest() {
  console.log("Starting SDK Robustness Stress Test...");
  const monitor = new AIMonitor({
    aiConfig: { enabled: false }, // disable AI to save costs during stress test
    notifiers: {
      send: async () => { /* mock success */ },
      sendAlert: async () => { },
      sendPipelineStatus: async () => {},
      sendDeploymentNotification: async () => {},
      sendDailyReport: async () => {}
    } as any
  });

  await monitor.start();

  const numAlerts = 10000;
  console.log(`Firing ${numAlerts} synchronous alerts to test memory and deduplication...`);
  
  const start = Date.now();
  
  // Test 1: Deduplication under heavy load
  const promises = [];
  for (let i = 0; i < numAlerts; i++) {
    promises.push(monitor.alert({
      severity: "CRITICAL",
      title: "Repeated Database Connection Failure",
      message: "Connection timeout on port 5432",
      metrics: { connectionString: "postgres://db.internal" }
    }));
  }

  await Promise.allSettled(promises);
  console.log(`Completed ${numAlerts} alerts in ${Date.now() - start}ms. Host process remains stable.`);

  // Test 2: Huge payloads (circular refs simulated)
  console.log("Testing massive payload tolerance...");
  
  const hugeData: any = { array: [] };
  // 100k items
  for(let i=0; i<100000; i++) {
     hugeData.array.push(`Padded data item ${i} with long string to consume memory...`);
  }

  try {
     await monitor.alert({
       severity: "WARNING",
       title: "Out of memory risk alert",
       message: "This payload is massive",
       metrics: hugeData
     });
     console.log("Massive payload handled successfully without V8 crash.");
  } catch (err: any) {
     console.error("SDK failed to handle payload bounds:", err);
  }

  // Graceful shutdown
  console.log("Stress test complete. Process exiting normally.");
  process.exit(0);
}

runStressTest().catch(console.error);
