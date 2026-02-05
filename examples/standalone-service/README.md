# FitCoach AI Monitor

AI-powered monitoring service for the FitCoach platform with Telegram integration.

## Features

- 🤖 **Telegram Notifications** - Real-time alerts via Telegram bot
- 📊 **Prometheus Integration** - Metrics collection and visualization
- 📈 **AI-Powered Analysis** - Intelligent alert detection
- 🔔 **Multi-Channel Alerts** - Telegram, Slack, Email support
- 🚨 **Auto-Healing** - Automatic issue resolution
- 📋 **Scheduled Reports** - Daily/weekly health reports

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Check Health

```bash
curl http://localhost:3333/health
```

## Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID

**Optional:**
- `ENABLE_TELEGRAM` - Enable Telegram notifications (default: true)
- `AI_API_KEY` - OpenAI API key for AI analysis
- `PROMETHEUS_URL` - Prometheus server URL

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-22T02:40:00.000Z"
}
```

### Send Alert
```
POST /alert
Content-Type: application/json

{
  "severity": "CRITICAL",
  "title": "High Error Rate",
  "message": "Error rate exceeded threshold",
  "metrics": {
    "error_rate": 0.15,
    "requests": 1000
  }
}
```

### Pipeline Status
```
POST /pipeline
Content-Type: application/json

{
  "jobName": "Backend Build",
  "buildNumber": "123",
  "status": "SUCCESS",
  "duration": 120,
  "url": "http://jenkins.example.com/job/backend/123/"
}
```

## Docker Services

The `docker-compose.yml` includes:

- **ai-monitor** - Main monitoring service (port 3333)
- **prometheus** - Metrics collection (port 9090)
- **grafana** - Metrics visualization (port 3000)

## Telegram Integration

Follow the [Telegram Bot Setup Guide](../docs/TELEGRAM_BOT_SETUP_GUIDE.md) for detailed instructions.

### Quick Setup

1. Create bot via @BotFather
2. Get bot token and chat ID
3. Update `.env` with credentials
4. Test bot:
   ```bash
   curl http://localhost:3333/test
   ```

## Development

### Run in Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Monitoring Dashboard

- **Grafana:** http://localhost:3000
  - Default credentials: `admin / admin`
- **Prometheus:** http://localhost:9090
  - Query metrics and view targets

## Alerts Configuration

### Thresholds

Configure alert thresholds in `.env`:

```bash
# Performance
HIGH_ERROR_RATE_THRESHOLD=0.05              # 5% error rate
HIGH_RESPONSE_TIME_THRESHOLD=3.0           # 3 seconds

# Resources
HIGH_MEMORY_USAGE_THRESHOLD=0.80             # 80% memory
HIGH_CPU_USAGE_THRESHOLD=0.90               # 90% CPU
DISK_SPACE_LOW_THRESHOLD=0.85               # 85% disk

# Security
BRUTE_FORCE_THRESHOLD=10                    # 10 failed attempts
UNUSUAL_TRAFFIC_THRESHOLD=5.0              # 500% increase

# Business
PAYMENT_FAILURE_THRESHOLD=0.03              # 3% failure rate
USER_DROPOFF_THRESHOLD=0.20                 # 20% dropoff
```

### Alert Types

The monitor detects and alerts on:

- **Performance Issues** - High error rates, slow response times
- **Resource Exhaustion** - Memory, CPU, disk space
- **Security Threats** - Brute force attempts, unusual traffic
- **Business Anomalies** - Payment failures, user dropoffs
- **Service Failures** - Database down, service unavailable

## Jenkins Integration

Add to your Jenkinsfile:

```groovy
pipeline {
    environment {
        AI_MONITOR_URL = 'http://ai-monitor:3333'
    }
    
    stages {
        stage('Build') {
            post {
                success {
                    script {
                        sh """
                        curl -X POST ${AI_MONITOR_URL}/pipeline \\
                          -H 'Content-Type: application/json' \\
                          -d '{
                            "jobName": "${env.JOB_NAME}",
                            "buildNumber": "${env.BUILD_NUMBER}",
                            "status": "SUCCESS",
                            "duration": ${currentBuild.duration}
                          }'
                        """
                    }
                }
                failure {
                    script {
                        sh """
                        curl -X POST ${AI_MONITOR_URL}/pipeline \\
                          -H 'Content-Type: application/json' \\
                          -d '{
                            "jobName": "${env.JOB_NAME}",
                            "buildNumber": "${env.BUILD_NUMBER}",
                            "status": "FAILURE"
                          }'
                        """
                    }
                }
            }
        }
    }
}
```

## Troubleshooting

### Bot Not Sending Messages

1. Check `ENABLE_TELEGRAM=true` in `.env`
2. Verify bot token and chat ID
3. Test with API:
   ```
   https://api.telegram.org/botTOKEN/sendMessage?chat_id=CHAT_ID&text=test
   ```
4. Check logs: `docker-compose logs ai-monitor`

### Service Not Starting

1. Check port conflicts: `lsof -i :3333`
2. Review logs: `docker-compose logs ai-monitor`
3. Verify environment variables are set
4. Check Docker is running: `docker ps`

### Grafana Not Showing Data

1. Verify Prometheus is running: `curl http://localhost:9090`
2. Check Prometheus targets: http://localhost:9090/targets
3. Review Grafana data source configuration
4. Check time range in dashboard

## Project Structure

```
ai-monitor/
├── src/
│   ├── alerts/
│   │   └── telegram-notifier.ts    # Telegram notification service
│   ├── config.ts                    # Configuration management
│   ├── utils/
│   │   └── logger.ts              # Logging utility
│   └── index.ts                   # Main entry point
├── prometheus/
│   └── prometheus.yml              # Prometheus configuration
├── grafana/
│   ├── provisioning/                 # Grafana provisioning
│   └── dashboards/                 # Pre-configured dashboards
├── Dockerfile                      # Docker image
├── docker-compose.yml               # Services orchestration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── .env.example                  # Environment template
```

## Documentation

- [Telegram Bot Setup Guide](../docs/TELEGRAM_BOT_SETUP_GUIDE.md)
- [CI/CD & AI Monitoring Plan](../docs/CICD_AI_MONITORING_PLAN.md)
- [Telegram Integration Guide](../fitCoach-bc/docs/telegram-integration-guide.md)

## License

MIT

## Support

For issues and questions:
- Check the troubleshooting section
- Review logs: `docker-compose logs -f ai-monitor`
- Consult documentation in `/docs`

---

**Version:** 1.0.0  
**Last Updated:** January 22, 2026
