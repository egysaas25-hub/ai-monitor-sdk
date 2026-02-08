# Production Setup Guide

Comprehensive guide to deploying AI Monitor SDK on a fresh server/project.

---

## 1. Get the SDK Ready

If you are cloning the SDK repo to your server:

```bash
# Clone the repo
git clone https://github.com/AKER-LINK/ai-monitor-sdk.git
cd ai-monitor-sdk

# Install & Build (Critical!)
pnpm install
pnpm run build
```

---

## 2. Integrate into Your Application

In your Node.js application (e.g. `siwa-backend`):

### Installation

**Option A: Local Link (Recommended for Monorepo)**

```bash
# In your app directory
npm install /path/to/ai-monitor-sdk/packages/ai-monitor-core
npm install /path/to/ai-monitor-sdk/packages/ai-monitor-instrumentation
npm install /path/to/ai-monitor-sdk/packages/ai-monitor-notifiers
```

**Option B: Git Dependency**

```bash
npm install github:AKER-LINK/ai-monitor-sdk#main
```

### Code Setup

Add this to your app entry point (e.g. `src/main.ts` or `index.js`):

```typescript
import { AIMonitor } from "@aker/ai-monitor-core";
import { Instrumentation } from "@aker/ai-monitor-instrumentation";
import * as dotenv from "dotenv";
dotenv.config();

// 1. Initialize Monitor
const monitor = new AIMonitor({
  port: 3333, // Metrics port
  enabled: true,
  aiConfig: {
    enabled: true,
    apiKey: process.env.AI_API_KEY, // Required for AI analysis
    model: "gpt-4o-mini",
  },
});

// 2. Initialize Auto-Instrumentation
const instrumentation = new Instrumentation({
  monitor,
  appName: "siwa-backend",
  enablePrometheus: true, // Exposes /metrics at :3333
});

// Start monitoring
await monitor.start();
instrumentation.start();

// 3. (Optional) Express Middleware
// app.use(instrumentation.httpMiddleware());
```

---

## 3. Configure AI & Logging

### AI Analysis

To enable AI insights (root cause analysis, anomaly detection), set your API key in `.env`:

```bash
AI_API_KEY=sk-proj-...
AI_MODEL=gpt-4o-mini
```

### Logging

The SDK automatically captures logs via `LogAggregator`.
To view logs:

- **Console**: Standard output (visible via `pm2 logs` or `docker logs`).
- **File**: Configured via `winston` transport (default: `logs/ai-monitor.log` if configured).
- **API**: The SDK exposes endpoints to query logs if enabled.

---

## 4. Visualization (Grafana + Prometheus)

To run the visualization stack using the SDK's provided Docker Compose:

1.  **Navigate to SDK folder:**

    ```bash
    cd ai-monitor-sdk
    ```

2.  **Configure Prometheus:**
    Edit `prometheus/prometheus.yml` to target **YOUR** application.

    _If your app runs on the host (outside Docker):_

    ```yaml
    scrape_configs:
      - job_name: "siwa-backend"
        static_configs:
          - targets: ["host.docker.internal:3333"] # Points to localhost:3333 on host
    ```

    _If your app runs in Docker:_

    ```yaml
    scrape_configs:
      - job_name: "siwa-backend"
        static_configs:
          - targets: ["your-app-container-name:3333"]
    ```

3.  **Start the Stack:**

    ```bash
    docker-compose up -d prometheus grafana
    ```

4.  **Access Dashboards:**
    - **Grafana**: `http://your-server-ip:3000` (User: `admin`, Pass: `admin`)
    - **Prometheus**: `http://your-server-ip:9090`

    _Note: The SDK includes pre-provisioned dashboards in `grafana/provisioning`._

---

## 5. Troubleshooting

**"Connection Refused" to Prometheus?**

- Ensure your app is running and the monitor started successfully on port `3333`.
- Check firewall settings (allow port 3000, 9090, 3333).

**"AI Analysis not working?"**

- Check `AI_API_KEY` is valid.
- Check logs for "AIService" errors.
