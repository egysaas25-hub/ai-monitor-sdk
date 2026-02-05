"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitor = void 0;
require("dotenv/config");
const winston_1 = __importDefault(require("winston"));
const ai_monitor_core_1 = require("@aker/ai-monitor-core");
const ai_monitor_notifiers_1 = require("@aker/ai-monitor-notifiers");
/**
 * Example: AI Monitor as a standalone service
 * This demonstrates how to use the plug-and-play packages
 */
// Create Winston logger
const winstonLogger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ level, message, timestamp, stack }) => {
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        }),
        new winston_1.default.transports.File({
            filename: process.env.LOG_FILE || '/app/logs/ai-monitor.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        })
    ]
});
// Create notifiers based on configuration
const notifiers = [];
// Add Telegram notifier if configured
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    notifiers.push(new ai_monitor_notifiers_1.TelegramNotifier({
        token: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    }));
    winstonLogger.info('Telegram notifier configured');
}
// Create AI Monitor instance
const monitor = new ai_monitor_core_1.AIMonitor({
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3333', 10),
    enabled: process.env.AI_MONITOR_ENABLED?.toLowerCase() !== 'false',
    notifiers: notifiers,
    logger: new ai_monitor_core_1.WinstonLoggerAdapter(winstonLogger),
    sendTestNotification: process.env.SEND_TEST_NOTIFICATION === 'true',
    testNotificationDelay: parseInt(process.env.TEST_NOTIFICATION_DELAY || '3000', 10)
});
exports.monitor = monitor;
// Graceful shutdown
process.on('SIGINT', async () => {
    winstonLogger.info('Shutting down gracefully...');
    await monitor.stop();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    winstonLogger.info('Shutting down gracefully...');
    await monitor.stop();
    process.exit(0);
});
// Start the monitor
monitor.start().catch((error) => {
    winstonLogger.error('Failed to start AI Monitor:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map