var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/ai-service.ts
var ai_service_exports = {};
__export(ai_service_exports, {
  AIService: () => AIService
});
var AIService;
var init_ai_service = __esm({
  "src/ai-service.ts"() {
    "use strict";
    AIService = class {
      constructor(config = {}) {
        this.enabled = false;
        this.config = {
          apiKey: config.apiKey ?? process.env.AI_API_KEY ?? "",
          apiUrl: config.apiUrl ?? process.env.AI_API_URL ?? "https://api.openai.com/v1",
          model: config.model ?? process.env.AI_MODEL ?? "gpt-4o-mini",
          enabled: config.enabled ?? true,
          features: {
            anomalyDetection: config.features?.anomalyDetection ?? true,
            rootCauseAnalysis: config.features?.rootCauseAnalysis ?? true,
            autoHealing: config.features?.autoHealing ?? true,
            patternRecognition: config.features?.patternRecognition ?? true,
            ...config.features
          }
        };
        if (!this.config.apiKey) {
          console.warn("AI Service: No API key provided. AI analysis will be disabled.");
          this.config.enabled = false;
        }
        if (this.config.enabled) {
          try {
            this.axios = __require("axios");
            this.enabled = true;
          } catch (error) {
            console.error("AI Service: Failed to load axios. Install with: npm install axios");
            this.enabled = false;
          }
        }
      }
      async analyzeLog(log) {
        if (!this.enabled) {
          return this.getFallbackAnalysis(log.message);
        }
        const prompt = this.buildLogAnalysisPrompt(log);
        return await this.analyze(prompt);
      }
      async analyzeLogs(logs) {
        if (!this.enabled) {
          return this.getFallbackAnalysis("Multiple logs");
        }
        const prompt = this.buildLogsAnalysisPrompt(logs);
        return await this.analyze(prompt);
      }
      async analyzeMetrics(metrics) {
        if (!this.enabled) {
          return this.getFallbackAnalysis("Metrics analysis");
        }
        const prompt = this.buildMetricsAnalysisPrompt(metrics);
        return await this.analyze(prompt);
      }
      async analyzeError(error, context) {
        if (!this.enabled) {
          return this.getFallbackAnalysis(error.message);
        }
        const prompt = this.buildErrorAnalysisPrompt(error, context);
        return await this.analyze(prompt);
      }
      async detectAnomalies(data) {
        if (!this.enabled || !this.config.features.anomalyDetection) {
          return this.getFallbackAnalysis("Anomaly detection");
        }
        const prompt = this.buildAnomalyDetectionPrompt(data);
        return await this.analyze(prompt);
      }
      async suggestAutoHeal(issue, context) {
        if (!this.enabled || !this.config.features.autoHealing) {
          return this.getFallbackAnalysis(issue);
        }
        const prompt = this.buildAutoHealPrompt(issue, context);
        return await this.analyze(prompt);
      }
      /**
       * Core AI analysis method
       */
      async analyze(prompt) {
        try {
          const response = await this.axios.post(
            `${this.config.apiUrl}/chat/completions`,
            {
              model: this.config.model,
              messages: [
                {
                  role: "system",
                  content: this.getSystemPrompt()
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              response_format: { type: "json_object" }
            },
            {
              headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                "Content-Type": "application/json"
              }
            }
          );
          const result = JSON.parse(response.data.choices[0].message.content);
          return this.parseAIResponse(result);
        } catch (error) {
          console.error("AI Service: Analysis failed:", error);
          return this.getFallbackAnalysis("AI analysis unavailable");
        }
      }
      /**
       * Build prompts for different analysis types
       */
      buildLogAnalysisPrompt(log) {
        return `Analyze this log entry and provide insights:

Timestamp: ${log.timestamp.toISOString()}
Level: ${log.level}
Message: ${log.message}
Context: ${log.context || "N/A"}
${log.stack ? `Stack Trace:
${log.stack}` : ""}
${log.metadata ? `Metadata: ${JSON.stringify(log.metadata)}` : ""}

Provide:
1. Severity assessment (LOW/MEDIUM/HIGH/CRITICAL)
2. Root cause analysis
3. Suggested fixes
4. Whether this is anomalous
5. Confidence score (0-1)`;
      }
      buildLogsAnalysisPrompt(logs) {
        const logSummary = logs.slice(0, 20).map((l) => `[${l.timestamp.toISOString()}] ${l.level}: ${l.message}`).join("\n");
        return `Analyze these log entries for patterns, anomalies, and issues:

Total Logs: ${logs.length}
Recent Logs:
${logSummary}

Identify:
1. Recurring patterns
2. Anomalies or unusual behavior
3. Critical issues
4. Root causes
5. Suggested fixes`;
      }
      buildMetricsAnalysisPrompt(metrics) {
        const metricSummary = metrics.map((m) => `${m.name}: ${m.value}${m.unit || ""} at ${m.timestamp.toISOString()}`).join("\n");
        return `Analyze these metrics for anomalies:

${metricSummary}

Detect:
1. Unusual spikes or drops
2. Trending issues
3. Performance degradation
4. Capacity problems
5. Suggested optimizations`;
      }
      buildErrorAnalysisPrompt(error, context) {
        return `Analyze this error and provide actionable insights:

Error: ${error.message}
Stack: ${error.stack || "N/A"}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ""}

Provide:
1. Root cause analysis
2. Impact assessment (severity)
3. Step-by-step fix suggestions
4. Prevention strategies
5. Auto-healing command (if applicable)`;
      }
      buildAnomalyDetectionPrompt(data) {
        return `Analyze this data for anomalies:

Data: ${JSON.stringify(data.slice(0, 50), null, 2)}

Detect:
1. Outliers and anomalies
2. Unusual patterns
3. Potential issues
4. Severity of anomalies
5. Recommended actions`;
      }
      buildAutoHealPrompt(issue, context) {
        return `Suggest auto-healing solutions for this issue:

Issue: ${issue}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ""}

Provide:
1. Automated fix command/script
2. Safety considerations
3. Rollback plan
4. Success verification steps`;
      }
      /**
       * System prompt for AI
       */
      getSystemPrompt() {
        return `You are an expert DevOps AI assistant specializing in system monitoring, log analysis, and automated problem resolution.

Your role:
- Analyze logs, metrics, and errors
- Detect anomalies and patterns
- Provide root cause analysis
- Suggest actionable fixes
- Recommend auto-healing solutions

Always respond in JSON format with these fields:
{
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Brief summary of the issue",
  "rootCause": "Root cause analysis",
  "suggestions": ["fix1", "fix2", ...],
  "isAnomaly": true|false,
  "confidence": 0.0-1.0,
  "relatedPatterns": ["pattern1", ...],
  "autoHealCommand": "command if applicable"
}

Be concise, actionable, and practical.`;
      }
      /**
       * Parse AI response into structured format
       */
      parseAIResponse(result) {
        return {
          severity: result.severity || "MEDIUM",
          summary: result.summary || "No summary available",
          rootCause: result.rootCause,
          suggestions: result.suggestions || [],
          isAnomaly: result.isAnomaly || false,
          confidence: result.confidence || 0.5,
          relatedPatterns: result.relatedPatterns || [],
          autoHealCommand: result.autoHealCommand
        };
      }
      /**
       * Fallback analysis when AI is disabled
       */
      getFallbackAnalysis(message) {
        return {
          severity: "MEDIUM",
          summary: message,
          rootCause: "AI analysis not available",
          suggestions: ["Enable AI analysis by providing an API key"],
          isAnomaly: false,
          confidence: 0,
          relatedPatterns: [],
          autoHealCommand: void 0
        };
      }
    };
  }
});

// src/index.ts
init_ai_service();

// src/alert-deduplicator.ts
var AlertDeduplicator = class {
  constructor(config = {}) {
    this.entries = /* @__PURE__ */ new Map();
    this.cooldownMs = config.cooldownMs ?? 3e5;
  }
  /**
   * Compute a fingerprint for an alert based on severity + title.
   */
  fingerprint(alert) {
    return `${alert.severity}::${alert.title}`;
  }
  /**
   * Check whether this alert should be sent.
   * Returns true if the alert has NOT been sent within the cooldown window.
   */
  shouldSend(alert) {
    const key = this.fingerprint(alert);
    const now = Date.now();
    const entry = this.entries.get(key);
    if (!entry || now - entry.lastSent >= this.cooldownMs) {
      this.entries.set(key, { lastSent: now, count: (entry?.count ?? 0) + 1 });
      return true;
    }
    entry.count++;
    return false;
  }
  /**
   * Number of alerts suppressed since last reset.
   */
  get suppressedCount() {
    let total = 0;
    for (const entry of this.entries.values()) {
      total += Math.max(0, entry.count - 1);
    }
    return total;
  }
  /**
   * Reset all dedup state.
   */
  reset() {
    this.entries.clear();
  }
  /**
   * Reset a specific key by severity + title.
   */
  resetKey(severity, title) {
    this.entries.delete(`${severity}::${title}`);
  }
};

// src/config-builder.ts
var ConfigBuilder = class {
  constructor(options = {}) {
    this.config = {};
    if (options.fromEnv) {
      this.loadFromEnv(options.envPrefix || "AI_MONITOR_");
    }
  }
  /**
   * Set the server host
   */
  host(host) {
    this.config.host = host;
    return this;
  }
  /**
   * Set the server port
   */
  port(port) {
    this.config.port = port;
    return this;
  }
  /**
   * Enable or disable monitoring
   */
  enabled(enabled) {
    this.config.enabled = enabled;
    return this;
  }
  /**
   * Add a notifier
   */
  addNotifier(notifier) {
    if (!this.config.notifiers) {
      this.config.notifiers = [];
    }
    if (Array.isArray(this.config.notifiers)) {
      this.config.notifiers.push(notifier);
    } else {
      this.config.notifiers = [this.config.notifiers, notifier];
    }
    return this;
  }
  /**
   * Set notifiers (replaces existing)
   */
  notifiers(notifiers) {
    this.config.notifiers = notifiers;
    return this;
  }
  /**
   * Set custom logger
   */
  logger(logger) {
    this.config.logger = logger;
    return this;
  }
  /**
   * Enable health endpoint
   */
  enableHealthEndpoint(enable = true) {
    this.config.enableHealthEndpoint = enable;
    return this;
  }
  /**
   * Enable alert endpoint
   */
  enableAlertEndpoint(enable = true) {
    this.config.enableAlertEndpoint = enable;
    return this;
  }
  /**
   * Enable pipeline endpoint
   */
  enablePipelineEndpoint(enable = true) {
    this.config.enablePipelineEndpoint = enable;
    return this;
  }
  /**
   * Send test notification on startup
   */
  sendTestNotification(send = true, delay) {
    this.config.sendTestNotification = send;
    if (delay !== void 0) {
      this.config.testNotificationDelay = delay;
    }
    return this;
  }
  /**
   * Configure alert deduplication
   */
  deduplication(enabled = true, cooldownMs) {
    this.config.deduplication = { enabled, cooldownMs };
    return this;
  }
  /**
   * Add a plugin
   */
  addPlugin(plugin) {
    if (!this.config.plugins) {
      this.config.plugins = [];
    }
    this.config.plugins.push(plugin);
    return this;
  }
  /**
   * Build the configuration
   */
  build() {
    return this.config;
  }
  /**
   * Load configuration from environment variables
   */
  loadFromEnv(prefix) {
    const getEnv = (key, defaultValue) => {
      return process.env[prefix + key] || defaultValue;
    };
    const getBool = (key, defaultValue = false) => {
      const value = getEnv(key);
      if (value === void 0) return defaultValue;
      return value.toLowerCase() === "true";
    };
    const getNumber = (key, defaultValue) => {
      const value = getEnv(key);
      if (value === void 0) return defaultValue;
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : num;
    };
    const host = getEnv("HOST");
    if (host) this.config.host = host;
    const port = getNumber("PORT");
    if (port) this.config.port = port;
    const enabled = getBool("ENABLED", true);
    this.config.enabled = enabled;
    const enableHealth = getBool("ENABLE_HEALTH_ENDPOINT", true);
    this.config.enableHealthEndpoint = enableHealth;
    const enableAlert = getBool("ENABLE_ALERT_ENDPOINT", true);
    this.config.enableAlertEndpoint = enableAlert;
    const enablePipeline = getBool("ENABLE_PIPELINE_ENDPOINT", true);
    this.config.enablePipelineEndpoint = enablePipeline;
    const sendTest = getBool("SEND_TEST_NOTIFICATION", false);
    this.config.sendTestNotification = sendTest;
    const testDelay = getNumber("TEST_NOTIFICATION_DELAY");
    if (testDelay) this.config.testNotificationDelay = testDelay;
  }
};
function createConfig(options) {
  return new ConfigBuilder(options);
}

// src/config-validator.ts
function validateConfig(config) {
  const errors = [];
  if (config.port !== void 0) {
    if (typeof config.port !== "number" || !Number.isFinite(config.port)) {
      errors.push(`port must be a finite number, got ${typeof config.port}`);
    } else if (config.port < 1 || config.port > 65535) {
      errors.push(`port must be between 1 and 65535, got ${config.port}`);
    }
  }
  if (config.host !== void 0 && typeof config.host !== "string") {
    errors.push(`host must be a string, got ${typeof config.host}`);
  }
  if (config.enabled !== void 0 && typeof config.enabled !== "boolean") {
    errors.push(`enabled must be a boolean, got ${typeof config.enabled}`);
  }
  if (config.notifiers !== void 0) {
    const notifiers = Array.isArray(config.notifiers) ? config.notifiers : [config.notifiers];
    notifiers.forEach((n, i) => {
      if (!n || typeof n.sendAlert !== "function") {
        errors.push(`notifiers[${i}] must implement INotifier (missing sendAlert method)`);
      }
    });
  }
  if (config.aiConfig?.enabled && !config.aiConfig.apiKey) {
    errors.push("aiConfig.apiKey is required when aiConfig.enabled is true");
  }
  if (config.deduplication) {
    if (config.deduplication.cooldownMs !== void 0) {
      if (typeof config.deduplication.cooldownMs !== "number" || config.deduplication.cooldownMs <= 0) {
        errors.push("deduplication.cooldownMs must be a positive number");
      }
    }
  }
  if (config.plugins) {
    if (!Array.isArray(config.plugins)) {
      errors.push("plugins must be an array");
    } else {
      config.plugins.forEach((p, i) => {
        if (!p || typeof p.name !== "string" || p.name.length === 0) {
          errors.push(`plugins[${i}] must have a non-empty name`);
        }
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

// src/logger-adapter.ts
var ConsoleLogger = class {
  info(message, ...meta) {
    console.log(`[INFO] ${message}`, ...meta);
  }
  warn(message, ...meta) {
    console.warn(`[WARN] ${message}`, ...meta);
  }
  error(message, ...meta) {
    console.error(`[ERROR] ${message}`, ...meta);
  }
  debug(message, ...meta) {
    console.debug(`[DEBUG] ${message}`, ...meta);
  }
};
var WinstonLoggerAdapter = class {
  constructor(winstonLogger) {
    this.winstonLogger = winstonLogger;
  }
  info(message, ...meta) {
    this.winstonLogger.info(message, ...meta);
  }
  warn(message, ...meta) {
    this.winstonLogger.warn(message, ...meta);
  }
  error(message, ...meta) {
    this.winstonLogger.error(message, ...meta);
  }
  debug(message, ...meta) {
    this.winstonLogger.debug(message, ...meta);
  }
};

// src/health-probes.ts
var HealthProbeManager = class {
  constructor(alertFn, logger) {
    this.probes = /* @__PURE__ */ new Map();
    this.results = /* @__PURE__ */ new Map();
    this.intervals = /* @__PURE__ */ new Map();
    this.alertFn = alertFn;
    this.logger = logger ?? new ConsoleLogger();
  }
  /**
   * Add an HTTP health probe.
   */
  addHttpProbe(name, url, opts) {
    this.probes.set(name, { name, type: "http", url, ...opts });
    return this;
  }
  /**
   * Add a TCP connectivity probe.
   */
  addTcpProbe(name, host, port, opts) {
    this.probes.set(name, { name, type: "tcp", host, port, ...opts });
    return this;
  }
  /**
   * Add a custom probe with an async check function.
   */
  addCustomProbe(name, check, opts) {
    this.probes.set(name, { name, type: "custom", check, ...opts });
    return this;
  }
  /**
   * Start polling all probes.
   */
  start() {
    for (const [name, probeConfig] of this.probes) {
      const intervalMs = probeConfig.intervalMs ?? 3e4;
      this.results.set(name, {
        name,
        healthy: true,
        // Assume healthy until proven otherwise
        lastCheck: /* @__PURE__ */ new Date(),
        consecutiveFailures: 0
      });
      const interval = setInterval(() => {
        this.runProbe(probeConfig).catch((err) => {
          this.logger.error(`Probe ${name} runner error:`, err);
        });
      }, intervalMs);
      this.intervals.set(name, interval);
      this.runProbe(probeConfig).catch((err) => {
        this.logger.error(`Probe ${name} initial check error:`, err);
      });
      this.logger.info(`\u{1F3E5} Health probe '${name}' started (every ${intervalMs / 1e3}s)`);
    }
  }
  /**
   * Stop all probes.
   */
  stop() {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      this.logger.debug(`Probe '${name}' stopped`);
    }
    this.intervals.clear();
  }
  /**
   * Get current status of all probes.
   */
  getStatus() {
    const status = {};
    for (const [name, result] of this.results) {
      status[name] = { ...result };
    }
    return status;
  }
  /**
   * Run a single probe check.
   */
  async runProbe(config) {
    const result = this.results.get(config.name);
    const wasHealthy = result.healthy;
    const start = Date.now();
    try {
      let probeResult;
      switch (config.type) {
        case "http":
          probeResult = await this.checkHttp(config);
          break;
        case "tcp":
          probeResult = await this.checkTcp(config);
          break;
        case "custom":
          probeResult = config.check ? await config.check() : { healthy: false, message: "No check function" };
          break;
        default:
          probeResult = { healthy: false, message: `Unknown probe type: ${config.type}` };
      }
      result.responseTimeMs = Date.now() - start;
      result.lastCheck = /* @__PURE__ */ new Date();
      if (probeResult.healthy) {
        if (!wasHealthy) {
          result.consecutiveFailures = 0;
          result.healthy = true;
          result.lastError = void 0;
          await this.alertFn({
            severity: "INFO",
            title: `\u2705 ${config.name} recovered`,
            message: `Health probe '${config.name}' is back online (${result.responseTimeMs}ms)`,
            timestamp: /* @__PURE__ */ new Date()
          });
        }
        result.healthy = true;
        result.consecutiveFailures = 0;
        result.lastError = void 0;
      } else {
        result.healthy = false;
        result.consecutiveFailures++;
        result.lastError = probeResult.message || "Check failed";
        const severity = result.consecutiveFailures >= 3 ? "CRITICAL" : "WARNING";
        await this.alertFn({
          severity,
          title: `\u{1F534} ${config.name} is down`,
          message: `Health probe '${config.name}' failed: ${result.lastError} (${result.consecutiveFailures} consecutive failures)`,
          metrics: { responseTimeMs: result.responseTimeMs, consecutiveFailures: result.consecutiveFailures },
          timestamp: /* @__PURE__ */ new Date()
        });
      }
    } catch (error) {
      result.responseTimeMs = Date.now() - start;
      result.lastCheck = /* @__PURE__ */ new Date();
      result.healthy = false;
      result.consecutiveFailures++;
      result.lastError = error.message || "Unknown error";
      const severity = result.consecutiveFailures >= 3 ? "CRITICAL" : "WARNING";
      await this.alertFn({
        severity,
        title: `\u{1F534} ${config.name} is down`,
        message: `Health probe '${config.name}' error: ${result.lastError} (${result.consecutiveFailures} consecutive failures)`,
        metrics: { responseTimeMs: result.responseTimeMs, consecutiveFailures: result.consecutiveFailures },
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
  /**
   * HTTP health check — uses native fetch (Node 18+).
   */
  async checkHttp(config) {
    const url = config.url;
    const expectedStatus = config.expectedStatus ?? 200;
    const timeoutMs = config.timeoutMs ?? 5e3;
    const method = config.method ?? "GET";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, signal: controller.signal });
      clearTimeout(timer);
      if (res.status === expectedStatus) {
        return { healthy: true };
      }
      return { healthy: false, message: `Expected status ${expectedStatus}, got ${res.status}` };
    } catch (error) {
      clearTimeout(timer);
      if (error.name === "AbortError") {
        return { healthy: false, message: `Timeout after ${timeoutMs}ms` };
      }
      return { healthy: false, message: error.message };
    }
  }
  /**
   * TCP connectivity check using Node.js net module.
   */
  async checkTcp(config) {
    const { host, port, timeoutMs = 5e3 } = config;
    return new Promise((resolve) => {
      try {
        const net = __require("net");
        const socket = new net.Socket();
        const timer = setTimeout(() => {
          socket.destroy();
          resolve({ healthy: false, message: `TCP timeout after ${timeoutMs}ms` });
        }, timeoutMs);
        socket.connect(port, host, () => {
          clearTimeout(timer);
          socket.destroy();
          resolve({ healthy: true });
        });
        socket.on("error", (err) => {
          clearTimeout(timer);
          socket.destroy();
          resolve({ healthy: false, message: err.message });
        });
      } catch (error) {
        resolve({ healthy: false, message: error.message });
      }
    });
  }
};

// src/monitor.ts
import { createServer } from "http";

// src/plugin.ts
var PluginManager = class {
  constructor() {
    this.plugins = [];
  }
  /**
   * Register a plugin and call its onInit hook.
   */
  async register(plugin, monitor) {
    this.plugins.push(plugin);
    if (plugin.onInit) {
      await plugin.onInit(monitor);
    }
  }
  /**
   * Run a named lifecycle hook across all plugins.
   */
  async runHook(hook, monitor) {
    for (const plugin of this.plugins) {
      const fn = plugin[hook];
      if (fn) {
        await fn.call(plugin, monitor);
      }
    }
  }
  /**
   * Run the alert pipeline: onAlert → onBeforeNotify.
   * Returns the final alert, or null if any plugin suppressed it.
   */
  async processAlert(alert, monitor) {
    let current = alert;
    for (const plugin of this.plugins) {
      if (!current) break;
      if (plugin.onAlert) {
        current = await plugin.onAlert(current, monitor);
      }
    }
    if (!current) return null;
    for (const plugin of this.plugins) {
      if (plugin.onBeforeNotify) {
        const shouldContinue = await plugin.onBeforeNotify(current);
        if (!shouldContinue) return null;
      }
    }
    return current;
  }
  /**
   * Retrieve a plugin by name.
   */
  getPlugin(name) {
    return this.plugins.find((p) => p.name === name);
  }
  /**
   * Number of registered plugins.
   */
  get count() {
    return this.plugins.length;
  }
};

// src/monitor.ts
var AIMonitor = class {
  constructor(config = {}) {
    this.isRunning = false;
    this.aiService = null;
    this.deduplicator = null;
    this.pluginManager = new PluginManager();
    this.probeManager = null;
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid AIMonitor config:
  - ${validation.errors.join("\n  - ")}`);
    }
    if (config.aiConfig?.enabled && config.aiConfig?.apiKey) {
      try {
        const { AIService: AIService2 } = (init_ai_service(), __toCommonJS(ai_service_exports));
        this.aiService = new AIService2(config.aiConfig);
        console.log("\u{1F916} AI-powered analysis enabled");
      } catch (error) {
        console.warn("AI Service unavailable. Install axios for AI features: npm install axios");
      }
    }
    this.config = {
      host: config.host ?? "0.0.0.0",
      port: config.port ?? 3333,
      enabled: config.enabled ?? true,
      notifiers: config.notifiers ?? [],
      logger: config.logger ?? new ConsoleLogger(),
      aiConfig: config.aiConfig,
      enableAIEnhancedAlerts: config.enableAIEnhancedAlerts ?? this.aiService !== null,
      enableHealthEndpoint: config.enableHealthEndpoint ?? true,
      enableAlertEndpoint: config.enableAlertEndpoint ?? true,
      enablePipelineEndpoint: config.enablePipelineEndpoint ?? true,
      sendTestNotification: config.sendTestNotification ?? false,
      testNotificationDelay: config.testNotificationDelay ?? 3e3
    };
    this.notifiers = Array.isArray(this.config.notifiers) ? this.config.notifiers : this.config.notifiers ? [this.config.notifiers] : [];
    this.logger = this.config.logger;
    if (config.deduplication?.enabled !== false && config.deduplication) {
      this.deduplicator = new AlertDeduplicator(config.deduplication);
      this.logger.info(`\u{1F507} Alert deduplication enabled (cooldown: ${config.deduplication.cooldownMs ?? 3e5}ms)`);
    }
    if (config.plugins && config.plugins.length > 0) {
      for (const plugin of config.plugins) {
        this.pluginManager.register(plugin, this).catch((err) => {
          this.logger.error(`Plugin '${plugin.name}' init failed:`, err);
        });
      }
      this.logger.info(`\u{1F50C} ${config.plugins.length} plugin(s) registered`);
    }
    if (config.probes && config.probes.length > 0) {
      this.probeManager = new HealthProbeManager((alert) => this.alert(alert), this.logger);
      for (const probe of config.probes) {
        switch (probe.type) {
          case "http":
            this.probeManager.addHttpProbe(probe.name, probe.url, probe);
            break;
          case "tcp":
            this.probeManager.addTcpProbe(probe.name, probe.host, probe.port, probe);
            break;
          case "custom":
            this.probeManager.addCustomProbe(probe.name, probe.check, probe);
            break;
        }
      }
    }
    this.server = createServer((req, res) => this.handleRequest(req, res));
    if (!this.config.enabled) {
      this.logger.warn("\u26A0\uFE0F  AI Monitor is disabled.");
    }
  }
  /**
   * Register a plugin at runtime.
   */
  async use(plugin) {
    await this.pluginManager.register(plugin, this);
    this.logger.info(`\u{1F50C} Plugin '${plugin.name}' registered`);
    return this;
  }
  /**
   * Start the monitoring server
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn("Monitor is already running");
      return;
    }
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, async () => {
        this.isRunning = true;
        if (this.config.enabled) {
          this.logger.info(`\u{1F680} AI Monitor started on http://${this.config.host}:${this.config.port}`);
          this.logger.info(`\u{1F4CA} Health check: http://${this.config.host}:${this.config.port}/health`);
          this.logger.info(`\u{1F4E2} Notifiers: ${this.notifiers.length} configured`);
          this.logger.info("\u2705 AI Monitoring is ENABLED");
        } else {
          this.logger.info(`\u{1F680} AI Monitor started on http://${this.config.host}:${this.config.port} (DISABLED MODE)`);
          this.logger.info("\u26A0\uFE0F  AI Monitoring is DISABLED");
        }
        await this.pluginManager.runHook("onStart", this);
        if (this.probeManager) {
          this.probeManager.start();
        }
        if (this.config.sendTestNotification && this.config.enabled) {
          setTimeout(() => {
            this.sendTestNotification();
          }, this.config.testNotificationDelay);
        }
        resolve();
      });
    });
  }
  /**
   * Stop the monitoring server
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }
    if (this.probeManager) {
      this.probeManager.stop();
    }
    await this.pluginManager.runHook("onStop", this);
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          this.logger.error("Error stopping server:", err);
          reject(err);
        } else {
          this.isRunning = false;
          this.logger.info("AI Monitor stopped");
          resolve();
        }
      });
    });
  }
  /**
   * Send an alert through all configured notifiers
   * If AI is enabled, the alert is analyzed first for severity and insights
   */
  async alert(alert) {
    if (!this.config.enabled) {
      this.logger.debug("Monitor disabled, skipping alert");
      return;
    }
    if (this.deduplicator && !this.deduplicator.shouldSend(alert)) {
      this.logger.debug(`\u{1F507} Alert deduplicated: [${alert.severity}] ${alert.title}`);
      return;
    }
    let enhancedAlert = {
      ...alert,
      timestamp: alert.timestamp || /* @__PURE__ */ new Date()
    };
    if (this.aiService && this.config.enableAIEnhancedAlerts) {
      try {
        const analysis = await this.aiService.analyzeLog({
          timestamp: enhancedAlert.timestamp,
          level: enhancedAlert.severity,
          message: enhancedAlert.message,
          metadata: enhancedAlert.metrics
        });
        enhancedAlert = {
          ...enhancedAlert,
          message: `${enhancedAlert.message}

\u{1F916} AI Analysis:
${analysis.summary}${analysis.rootCause ? `

**Root Cause:** ${analysis.rootCause}` : ""}${analysis.suggestions && analysis.suggestions.length > 0 ? `

**Suggestions:**
${analysis.suggestions.map((s) => `\u2022 ${s}`).join("\n")}` : ""}`,
          metrics: {
            ...enhancedAlert.metrics,
            aiAnalysis: analysis
          }
        };
        this.logger.info(
          `\u{1F916} AI Enhanced: [${alert.severity}] ${alert.title} (Confidence: ${Math.round((analysis.confidence || 0) * 100)}%)`
        );
      } catch (error) {
        this.logger.warn("AI analysis failed, sending original alert:", error);
      }
    }
    const processed = await this.pluginManager.processAlert(enhancedAlert, this);
    if (!processed) {
      this.logger.debug(`\u{1F50C} Alert suppressed by plugin: [${alert.severity}] ${alert.title}`);
      return;
    }
    enhancedAlert = { ...processed, timestamp: processed.timestamp || enhancedAlert.timestamp };
    this.logger.info(`\u{1F4E2} Alert: [${enhancedAlert.severity}] ${enhancedAlert.title}`);
    await this.notifyAll(async (notifier) => {
      await notifier.sendAlert(enhancedAlert);
    });
  }
  /**
   * Send pipeline status notification
   */
  async pipelineStatus(status) {
    if (!this.config.enabled) {
      this.logger.debug("Monitor disabled, skipping pipeline status");
      return;
    }
    this.logger.info(`\u{1F527} Pipeline: ${status.jobName} - ${status.status}`);
    await this.notifyAll(async (notifier) => {
      await notifier.sendPipelineStatus(status);
    });
  }
  /**
   * Send deployment notification
   */
  async deployment(deployment) {
    if (!this.config.enabled) {
      this.logger.debug("Monitor disabled, skipping deployment notification");
      return;
    }
    this.logger.info(`\u{1F680} Deployment: ${deployment.environment} - ${deployment.status}`);
    await this.notifyAll(async (notifier) => {
      await notifier.sendDeploymentNotification(deployment);
    });
  }
  /**
   * Send daily report
   */
  async dailyReport(report) {
    if (!this.config.enabled) {
      this.logger.debug("Monitor disabled, skipping daily report");
      return;
    }
    this.logger.info(`\u{1F4CA} Daily Report: ${report.totalAlerts} alerts`);
    await this.notifyAll(async (notifier) => {
      await notifier.sendDailyReport(report);
    });
  }
  /**
   * Send a raw message through all notifiers
   */
  async notify(message) {
    if (!this.config.enabled) {
      this.logger.debug("Monitor disabled, skipping notification");
      return;
    }
    await this.notifyAll(async (notifier) => {
      await notifier.send(message);
    });
  }
  /**
   * Handle incoming HTTP requests
   */
  handleRequest(req, res) {
    const { method, url } = req;
    if (method === "GET" && url === "/health" && this.config.enableHealthEndpoint) {
      this.handleHealthCheck(res);
      return;
    }
    if (method === "POST" && url === "/alert" && this.config.enableAlertEndpoint) {
      this.handleAlertEndpoint(req, res);
      return;
    }
    if (method === "POST" && url === "/pipeline" && this.config.enablePipelineEndpoint) {
      this.handlePipelineEndpoint(req, res);
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
  /**
   * Handle health check endpoint
   */
  handleHealthCheck(res) {
    const health = {
      status: "healthy",
      enabled: this.config.enabled,
      notifiers: this.notifiers.length,
      plugins: this.pluginManager.count,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.deduplicator) {
      health.suppressedAlerts = this.deduplicator.suppressedCount;
    }
    if (this.probeManager) {
      health.probes = this.probeManager.getStatus();
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(health));
  }
  /**
   * Handle alert endpoint
   */
  handleAlertEndpoint(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const alert = JSON.parse(body);
        await this.alert(alert);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        this.logger.error("Error processing alert:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to process alert" }));
      }
    });
  }
  /**
   * Handle pipeline endpoint
   */
  handlePipelineEndpoint(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const status = JSON.parse(body);
        await this.pipelineStatus(status);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        this.logger.error("Error processing pipeline status:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to process pipeline status" }));
      }
    });
  }
  /**
   * Send test notification
   */
  async sendTestNotification() {
    this.logger.info("Sending test notification...");
    try {
      await this.notify("\u{1F680} AI Monitor is running!\n\nMonitoring active and ready to receive alerts.");
      this.logger.info("Test notification sent successfully");
    } catch (error) {
      this.logger.error("Failed to send test notification:", error);
    }
  }
  /**
   * Helper to notify all notifiers
   */
  async notifyAll(action) {
    if (this.notifiers.length === 0) {
      this.logger.warn("No notifiers configured");
      return;
    }
    const results = await Promise.allSettled(this.notifiers.map((notifier) => action(notifier)));
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        this.logger.error(`Notifier ${index} failed:`, result.reason);
      }
    });
  }
};
export {
  AIMonitor,
  AIService,
  AlertDeduplicator,
  ConfigBuilder,
  ConsoleLogger,
  HealthProbeManager,
  PluginManager,
  WinstonLoggerAdapter,
  createConfig,
  validateConfig
};
