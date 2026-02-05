"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    // AI Configuration
    AI_API_KEY: process.env.AI_API_KEY,
    AI_API_URL: process.env.AI_API_URL || 'https://api.openai.com/v1',
    AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',
    // Telegram Bot Configuration
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    // Slack Configuration
    SLACK_WEBHOOK: process.env.SLACK_WEBHOOK,
    // Email Configuration
    EMAIL_ALERTS: process.env.EMAIL_ALERTS === 'true',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_TO: process.env.EMAIL_TO?.split(','),
    // Prometheus Configuration
    PROMETHEUS_URL: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
    // Monitoring Configuration
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60') * 1000, // milliseconds
    // Auto-Healing Configuration
    AUTO_HEAL_ENABLED: process.env.AUTO_HEAL_ENABLED !== 'false',
    AUTO_HEAL_MAX_ATTEMPTS: parseInt(process.env.AUTO_HEAL_MAX_ATTEMPTS || '3'),
    AUTO_HEAL_COOLDOWN: parseInt(process.env.AUTO_HEAL_COOLDOWN || '300') * 1000, // 5 minutes
    // Alert Thresholds
    HIGH_ERROR_RATE_THRESHOLD: parseFloat(process.env.HIGH_ERROR_RATE_THRESHOLD || '0.05'), // 5%
    HIGH_RESPONSE_TIME_THRESHOLD: parseFloat(process.env.HIGH_RESPONSE_TIME_THRESHOLD || '3.0'), // 3 seconds
    HIGH_MEMORY_USAGE_THRESHOLD: parseFloat(process.env.HIGH_MEMORY_USAGE_THRESHOLD || '0.80'), // 80%
    HIGH_CPU_USAGE_THRESHOLD: parseFloat(process.env.HIGH_CPU_USAGE_THRESHOLD || '0.90'), // 90%
    DISK_SPACE_LOW_THRESHOLD: parseFloat(process.env.DISK_SPACE_LOW_THRESHOLD || '0.85'), // 85%
    // Security Thresholds
    BRUTE_FORCE_THRESHOLD: parseInt(process.env.BRUTE_FORCE_THRESHOLD || '10'),
    UNUSUAL_TRAFFIC_THRESHOLD: parseFloat(process.env.UNUSUAL_TRAFFIC_THRESHOLD || '5.0'), // 500%
    // Business Thresholds
    PAYMENT_FAILURE_THRESHOLD: parseFloat(process.env.PAYMENT_FAILURE_THRESHOLD || '0.03'), // 3%
    USER_DROPOFF_THRESHOLD: parseFloat(process.env.USER_DROPOFF_THRESHOLD || '0.20'), // 20%
    // Notification Channels
    ENABLE_TELEGRAM: process.env.ENABLE_TELEGRAM === 'true',
    ENABLE_SLACK: process.env.ENABLE_SLACK === 'true',
    ENABLE_EMAIL: process.env.ENABLE_EMAIL === 'true',
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || '/app/logs/ai-monitor.log',
    // Server
    PORT: parseInt(process.env.PORT || '3333'),
    HOST: process.env.HOST || '0.0.0.0'
};
//# sourceMappingURL=config.js.map