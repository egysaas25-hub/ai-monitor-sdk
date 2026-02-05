"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ErrorInterceptor: () => ErrorInterceptor,
  ExternalResourceMonitor: () => ExternalResourceMonitor,
  HttpInterceptor: () => HttpInterceptor,
  Instrumentation: () => Instrumentation,
  MetricAggregator: () => MetricAggregator,
  PerformanceMonitor: () => PerformanceMonitor,
  PrometheusExporter: () => PrometheusExporter,
  SystemMetricsCollector: () => SystemMetricsCollector
});
module.exports = __toCommonJS(index_exports);

// src/system-metrics.ts
var os = __toESM(require("os"));
var SystemMetricsCollector = class {
  constructor(config) {
    this.intervalId = null;
    this.previousCpuUsage = null;
    this.config = config;
  }
  /**
   * Start collecting system metrics
   */
  start() {
    if (!this.config.captureSystemMetrics) {
      return;
    }
    this.collect();
    this.intervalId = setInterval(() => {
      this.collect();
    }, this.config.systemMetricsInterval);
  }
  /**
   * Stop collecting
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  /**
   * Collect current system metrics
   */
  async collect() {
    try {
      const metrics = this.getSystemMetrics();
      const memUsage = metrics.memory.percentage;
      const memThresholds = this.config.thresholds?.memory || { warning: 0.6, critical: 0.8 };
      if (memUsage > memThresholds.critical) {
        await this.config.monitor.alert({
          severity: "CRITICAL",
          title: "Critical Memory Usage",
          message: `Memory usage at ${(memUsage * 100).toFixed(1)}% (Critical > ${memThresholds.critical * 100}%)`,
          metrics: { ...metrics, action: "Check for leaks" }
        });
      } else if (memUsage > memThresholds.warning) {
        await this.config.monitor.alert({
          severity: "WARNING",
          title: "High Memory Usage",
          message: `Memory usage at ${(memUsage * 100).toFixed(1)}% (Warning > ${memThresholds.warning * 100}%)`,
          metrics: { ...metrics, action: "Check for leaks" }
        });
      }
      const cpuUsage = metrics.cpu.usage;
      const cpuThresholds = this.config.thresholds?.cpu || { warning: 0.5, critical: 0.7 };
      if (cpuUsage > cpuThresholds.critical) {
        await this.config.monitor.alert({
          severity: "CRITICAL",
          title: "Critical CPU Usage",
          message: `CPU usage at ${(cpuUsage * 100).toFixed(1)}% (Critical > ${cpuThresholds.critical * 100}%)`,
          metrics: { ...metrics, action: "Scale up" }
        });
      } else if (cpuUsage > cpuThresholds.warning) {
        await this.config.monitor.alert({
          severity: "WARNING",
          title: "High CPU Usage",
          message: `CPU usage at ${(cpuUsage * 100).toFixed(1)}% (Warning > ${cpuThresholds.warning * 100}%)`,
          metrics: { ...metrics, action: "Scale up" }
        });
      }
    } catch (error) {
      console.error("Failed to collect system metrics:", error);
    }
  }
  /**
   * Get current system metrics
   */
  getSystemMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpuInfo = this.getCpuUsage();
    return {
      cpu: {
        usage: cpuInfo.usage,
        average: cpuInfo.average
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: usedMemory / totalMemory
      },
      uptime: process.uptime(),
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Calculate CPU usage
   */
  getCpuUsage() {
    const currentUsage = process.cpuUsage(this.previousCpuUsage || void 0);
    this.previousCpuUsage = process.cpuUsage();
    const totalUsage = currentUsage.user + currentUsage.system;
    const elapsedTime = this.config.systemMetricsInterval * 1e3;
    const usage = totalUsage / elapsedTime;
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const average = loadAvg / cpuCount;
    return {
      usage: Math.min(usage, 1),
      // Cap at 100%
      average: Math.min(average, 1)
    };
  }
};

// src/error-interceptor.ts
var ErrorInterceptor = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Start intercepting errors
   */
  start() {
    if (!this.config.captureErrors) {
      return;
    }
    this.originalUncaughtException = process.listeners("uncaughtException");
    process.removeAllListeners("uncaughtException");
    process.on("uncaughtException", async (error) => {
      await this.handleError(error, "uncaughtException");
      this.originalUncaughtException.forEach((handler) => {
        try {
          handler(error);
        } catch (e) {
        }
      });
    });
    this.originalUnhandledRejection = process.listeners("unhandledRejection");
    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", async (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await this.handleError(error, "unhandledRejection");
      this.originalUnhandledRejection.forEach((handler) => {
        try {
          handler(reason, promise);
        } catch (e) {
        }
      });
    });
  }
  /**
   * Stop intercepting
   */
  stop() {
    process.removeAllListeners("uncaughtException");
    process.removeAllListeners("unhandledRejection");
    if (this.originalUncaughtException) {
      this.originalUncaughtException.forEach((handler) => {
        process.on("uncaughtException", handler);
      });
    }
    if (this.originalUnhandledRejection) {
      this.originalUnhandledRejection.forEach((handler) => {
        process.on("unhandledRejection", handler);
      });
    }
  }
  /**
   * Handle an error
   */
  async handleError(error, type) {
    try {
      if (this.config.errorFilter && !this.config.errorFilter(error)) {
        return;
      }
      await this.config.monitor.alert({
        severity: "CRITICAL",
        title: `${type}: ${error.name}`,
        message: error.message,
        metrics: {
          errorType: type,
          errorName: error.name,
          stack: error.stack,
          appName: this.config.appName,
          environment: this.config.environment
        }
      });
    } catch (alertError) {
      console.error("Failed to send error alert:", alertError);
    }
  }
  /**
   * Manually capture an error
   */
  async captureError(error, context) {
    if (!this.config.captureErrors) {
      return;
    }
    if (this.config.errorFilter && !this.config.errorFilter(error)) {
      return;
    }
    await this.config.monitor.alert({
      severity: "CRITICAL",
      title: `Error: ${error.name}`,
      message: error.message,
      metrics: {
        errorName: error.name,
        stack: error.stack,
        context,
        appName: this.config.appName,
        environment: this.config.environment
      }
    });
  }
};

// src/performance-monitor.ts
var PerformanceMonitor = class {
  constructor(config) {
    this.measurements = /* @__PURE__ */ new Map();
    this.config = config;
  }
  /**
   * Start measuring an operation
   */
  startMeasure(operationName) {
    if (!this.config.capturePerformance) {
      return;
    }
    this.measurements.set(operationName, Date.now());
  }
  /**
   * End measurement and alert if slow
   */
  async endMeasure(operationName, context) {
    if (!this.config.capturePerformance) {
      return null;
    }
    const startTime = this.measurements.get(operationName);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationName}`);
      return null;
    }
    const duration = Date.now() - startTime;
    this.measurements.delete(operationName);
    const metric = {
      operation: operationName,
      duration,
      timestamp: /* @__PURE__ */ new Date(),
      context
    };
    if (duration > this.config.performanceThreshold) {
      await this.config.monitor.alert({
        severity: "WARNING",
        title: "Slow Operation Detected",
        message: `Operation "${operationName}" took ${duration}ms (threshold: ${this.config.performanceThreshold}ms)`,
        metrics: {
          ...metric,
          threshold: this.config.performanceThreshold,
          appName: this.config.appName,
          environment: this.config.environment
        }
      });
    }
    return metric;
  }
  /**
   * Measure a function execution
   */
  async measure(operationName, fn, context) {
    this.startMeasure(operationName);
    try {
      const result = await fn();
      await this.endMeasure(operationName, context);
      return result;
    } catch (error) {
      await this.endMeasure(operationName, { ...context, error: true });
      throw error;
    }
  }
  /**
   * Create a decorator for methods
   */
  measureDecorator(operationName) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      const opName = operationName || `${target.constructor.name}.${propertyKey}`;
      descriptor.value = async function(...args) {
        return this.measure(opName, () => originalMethod.apply(this, args));
      };
      return descriptor;
    };
  }
};

// src/http-interceptor.ts
var HttpInterceptor = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Create Express/Connect middleware
   */
  middleware() {
    return async (req, res, next) => {
      if (!this.config.captureHttp) {
        return next();
      }
      const startTime = Date.now();
      const originalEnd = res.end;
      const self = this;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        const metric = {
          method: req.method,
          url: req.url || req.originalUrl,
          statusCode: res.statusCode,
          duration,
          timestamp: /* @__PURE__ */ new Date()
        };
        setImmediate(async () => {
          await self.handleHttpMetric(metric);
        });
        return originalEnd.apply(res, args);
      };
      next();
    };
  }
  /**
   * Wrap Node.js http.Server
   */
  wrapHttpServer(server) {
    if (!this.config.captureHttp) {
      return;
    }
    const originalEmit = server.emit;
    const self = this;
    server.emit = function(event, ...args) {
      if (event === "request") {
        const req = args[0];
        const res = args[1];
        const startTime = Date.now();
        const originalEnd = res.end;
        res.end = function(...endArgs) {
          const duration = Date.now() - startTime;
          const metric = {
            method: req.method || "UNKNOWN",
            url: req.url || "/",
            statusCode: res.statusCode,
            duration,
            timestamp: /* @__PURE__ */ new Date()
          };
          setImmediate(async () => {
            await self.handleHttpMetric(metric);
          });
          return originalEnd.apply(res, endArgs);
        };
      }
      return originalEmit.apply(server, [event, ...args]);
    };
  }
  /**
   * Handle HTTP metric
   */
  async handleHttpMetric(metric) {
    try {
      if (metric.duration > this.config.performanceThreshold) {
        await this.config.monitor.alert({
          severity: "WARNING",
          title: "Slow HTTP Request",
          message: `${metric.method} ${metric.url} took ${metric.duration}ms`,
          metrics: {
            ...metric,
            threshold: this.config.performanceThreshold,
            appName: this.config.appName,
            environment: this.config.environment
          }
        });
      }
      if (metric.statusCode && metric.statusCode >= 500) {
        await this.config.monitor.alert({
          severity: "CRITICAL",
          title: "HTTP Server Error",
          message: `${metric.method} ${metric.url} returned ${metric.statusCode}`,
          metrics: {
            ...metric,
            appName: this.config.appName,
            environment: this.config.environment
          }
        });
      }
      if (metric.statusCode && metric.statusCode >= 400 && metric.statusCode < 500) {
        console.debug(`HTTP ${metric.statusCode}: ${metric.method} ${metric.url}`);
      }
    } catch (error) {
      console.error("Failed to handle HTTP metric:", error);
    }
  }
  /**
   * Track outgoing HTTP requests (fetch, axios, etc.)
   */
  trackOutgoingRequest(url, options) {
    const startTime = Date.now();
    const method = options?.method || "GET";
    return {
      end: async (statusCode, error) => {
        const duration = Date.now() - startTime;
        const metric = {
          method,
          url,
          statusCode,
          duration,
          timestamp: /* @__PURE__ */ new Date(),
          error: error?.message
        };
        await this.handleHttpMetric(metric);
      }
    };
  }
};

// src/metric-aggregator.ts
var MetricAggregator = class {
  constructor(config) {
    this.responseTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.intervalId = null;
    // Defaults per user requirement
    this.DEFAULT_THRESHOLDS = {
      responseTime: { warning: 200, critical: 500 },
      errorRate: { warning: 0.1, critical: 1 },
      // percentages
      cpu: { warning: 0.5, critical: 0.7 },
      memory: { warning: 0.6, critical: 0.8 },
      dbConnections: { warning: 0.5, critical: 0.8 },
      queueLength: { warning: 100, critical: 1e3 }
    };
    this.config = config;
    this.thresholds = {
      ...this.DEFAULT_THRESHOLDS,
      ...config.thresholds
    };
  }
  start() {
    this.intervalId = setInterval(() => this.aggregateAndAlert(), 6e4);
  }
  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
  /**
   * Record a request duration
   */
  recordRequest(duration, isError) {
    this.responseTimes.push(duration);
    this.requestCount++;
    if (isError) this.errorCount++;
  }
  /**
   * Calculate metrics and alert if needed
   */
  async aggregateAndAlert() {
    if (this.responseTimes.length === 0) return;
    this.responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(this.responseTimes.length * 0.95);
    const p95 = this.responseTimes[p95Index];
    const errorRate = this.errorCount / this.requestCount * 100;
    if (p95 > this.thresholds.responseTime.critical) {
      await this.config.monitor.alert({
        severity: "CRITICAL",
        title: "Critical Latency (P95)",
        message: `P95 Response time is ${p95}ms (Critical > ${this.thresholds.responseTime.critical}ms)`,
        metrics: { p95, threshold: this.thresholds.responseTime.critical, action: "Optimize queries" }
      });
    } else if (p95 > this.thresholds.responseTime.warning) {
      await this.config.monitor.alert({
        severity: "WARNING",
        title: "High Latency (P95)",
        message: `P95 Response time is ${p95}ms (Warning > ${this.thresholds.responseTime.warning}ms)`,
        metrics: { p95, threshold: this.thresholds.responseTime.warning, action: "Optimize queries" }
      });
    }
    if (errorRate > this.thresholds.errorRate.critical) {
      await this.config.monitor.alert({
        severity: "CRITICAL",
        title: "Critical Error Rate",
        message: `Error rate is ${errorRate.toFixed(2)}% (Critical > ${this.thresholds.errorRate.critical}%)`,
        metrics: { errorRate, threshold: this.thresholds.errorRate.critical, action: "Investigate errors" }
      });
    } else if (errorRate > this.thresholds.errorRate.warning) {
      await this.config.monitor.alert({
        severity: "WARNING",
        title: "Elevated Error Rate",
        message: `Error rate is ${errorRate.toFixed(2)}% (Warning > ${this.thresholds.errorRate.warning}%)`,
        metrics: { errorRate, threshold: this.thresholds.errorRate.warning, action: "Investigate errors" }
      });
    }
    this.responseTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
  }
  /**
   * Get current thresholds (useful for other components)
   */
  getThresholds() {
    return this.thresholds;
  }
};

// src/prometheus-exporter.ts
var PrometheusExporter = class {
  constructor() {
    this.metrics = /* @__PURE__ */ new Map();
    this.register("http_request_duration_seconds", "HTTP request duration in seconds", "histogram");
    this.register("http_requests_total", "Total number of HTTP requests", "counter");
    this.register("process_cpu_usage_ratio", "Process CPU usage ratio", "gauge");
    this.register("process_memory_usage_bytes", "Process memory usage in bytes", "gauge");
    this.register("db_connections_active", "Number of active database connections", "gauge");
    this.register("job_queue_length", "Current number of jobs in queue", "gauge");
  }
  register(name, help, type) {
    this.metrics.set(name, { name, help, type, values: /* @__PURE__ */ new Map() });
  }
  observe(name, value, labels = {}) {
    const metric = this.metrics.get(name);
    if (!metric) return;
    const key = this.serializeLabels(labels);
    if (metric.type === "histogram") {
      const sumKey = this.serializeLabels({ ...labels });
      const currentSum = metric.values.get(sumKey + "_sum") || 0;
      const currentCount = metric.values.get(sumKey + "_count") || 0;
      metric.values.set(sumKey + "_sum", currentSum + value);
      metric.values.set(sumKey + "_count", currentCount + 1);
    } else if (metric.type === "counter") {
      const current = metric.values.get(key) || 0;
      metric.values.set(key, current + value);
    } else {
      metric.values.set(key, value);
    }
  }
  /**
   * Handle /metrics endpoint
   */
  async handleRequest(req, res) {
    const output = this.generateOutput();
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(output);
  }
  generateOutput() {
    let output = "";
    for (const [name, metric] of this.metrics) {
      output += `# HELP ${name} ${metric.help}
`;
      output += `# TYPE ${name} ${metric.type}
`;
      for (const [key, value] of metric.values) {
        if (metric.type === "histogram") {
          output += `${name}${key.replace("_sum", "")}_sum ${value}
`;
        } else {
          output += `${name}${key} ${value}
`;
        }
      }
    }
    return output;
  }
  serializeLabels(labels) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return "";
    return "{" + entries.map(([k, v]) => `${k}="${v}"`).join(",") + "}";
  }
};

// src/resource-monitor.ts
var ExternalResourceMonitor = class {
  constructor(config) {
    this.intervalId = null;
    this.config = config;
  }
  /**
   * Register a function to count active DB connections
   */
  registerDbConnectionCheck(fn) {
    this.dbCountFn = fn;
  }
  /**
   * Register a function to count queue length
   */
  registerQueueCheck(fn) {
    this.queueCountFn = fn;
  }
  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.check(), 3e4);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  async check() {
    if (this.dbCountFn) {
      try {
        const connections = await this.dbCountFn();
        const thresholds = this.config.thresholds?.dbConnections || { warning: 50, critical: 80 };
        if (connections > thresholds.critical) {
          await this.config.monitor.alert({
            severity: "CRITICAL",
            title: "Critical DB Connection Usage",
            message: `DB Connections at ${connections}% (Critical > ${thresholds.critical}%)`,
            metrics: { connections, action: "Increase pool" }
          });
        } else if (connections > thresholds.warning) {
          await this.config.monitor.alert({
            severity: "WARNING",
            title: "High DB Connection Usage",
            message: `DB Connections at ${connections}% (Warning > ${thresholds.warning}%)`,
            metrics: { connections, action: "Increase pool" }
          });
        }
      } catch (e) {
        console.error("Error checking DB connections", e);
      }
    }
    if (this.queueCountFn) {
      try {
        const length = await this.queueCountFn();
        const thresholds = this.config.thresholds?.queueLength || { warning: 100, critical: 1e3 };
        if (length > thresholds.critical) {
          await this.config.monitor.alert({
            severity: "CRITICAL",
            title: "Critical Queue Length",
            message: `Queue length is ${length} (Critical > ${thresholds.critical})`,
            metrics: { length, action: "Add workers" }
          });
        } else if (length > thresholds.warning) {
          await this.config.monitor.alert({
            severity: "WARNING",
            title: "High Queue Length",
            message: `Queue length is ${length} (Warning > ${thresholds.warning})`,
            metrics: { length, action: "Add workers" }
          });
        }
      } catch (e) {
        console.error("Error checking Queue length", e);
      }
    }
  }
};

// src/instrumentation.ts
var Instrumentation = class {
  constructor(config) {
    this.isRunning = false;
    this.config = {
      monitor: config.monitor,
      enablePrometheus: config.enablePrometheus ?? true,
      thresholds: config.thresholds,
      captureErrors: config.captureErrors ?? true,
      capturePerformance: config.capturePerformance ?? true,
      captureHttp: config.captureHttp ?? true,
      captureDatabase: config.captureDatabase ?? true,
      captureSystemMetrics: config.captureSystemMetrics ?? true,
      systemMetricsInterval: config.systemMetricsInterval ?? 6e4,
      appName: config.appName ?? "unknown",
      environment: config.environment ?? process.env.NODE_ENV ?? "development",
      errorFilter: config.errorFilter
    };
    this.systemMetrics = new SystemMetricsCollector(this.config);
    this.errorInterceptor = new ErrorInterceptor(this.config);
    this.performanceMonitor = new PerformanceMonitor(this.config);
    this.httpInterceptor = new HttpInterceptor(this.config);
    this.metricAggregator = new MetricAggregator(this.config);
    this.prometheusExporter = new PrometheusExporter();
    this.resourceMonitor = new ExternalResourceMonitor(this.config);
  }
  start() {
    if (this.isRunning) return;
    console.log("\u{1F50D} Starting auto-instrumentation with Golden Signals...");
    this.systemMetrics.start();
    this.errorInterceptor.start();
    this.metricAggregator.start();
    this.resourceMonitor.start();
    this.isRunning = true;
    console.log("\u2705 Golden Signals Monitoring Active");
  }
  stop() {
    if (!this.isRunning) return;
    this.systemMetrics.stop();
    this.errorInterceptor.stop();
    this.metricAggregator.stop();
    this.resourceMonitor.stop();
    this.isRunning = false;
  }
  /**
   * Register custom resource checks
   */
  monitorDbConnection(fn) {
    this.resourceMonitor.registerDbConnectionCheck(fn);
  }
  monitorQueueLength(fn) {
    this.resourceMonitor.registerQueueCheck(fn);
  }
  /**
   * Get Express/Connect middleware
   * Now also records metric data for aggregation
   */
  httpMiddleware() {
    const baseMiddleware = this.httpInterceptor.middleware();
    return async (req, res, next) => {
      if (this.config.enablePrometheus && req.path === "/metrics") {
        return this.prometheusExporter.handleRequest(req, res);
      }
      const start = Date.now();
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = Date.now() - start;
        const isError = res.statusCode >= 500;
        this.metricAggregator.recordRequest(duration, isError);
        this.prometheusExporter.observe("http_request_duration_seconds", duration / 1e3, { method: req.method, path: req.path });
        this.prometheusExporter.observe("http_requests_total", 1, { method: req.method, status: res.statusCode.toString() });
        return originalEnd.apply(res, args);
      };
      return baseMiddleware(req, res, next);
    };
  }
  /**
   * Wrap an HTTP server
   */
  wrapHttpServer(server) {
    this.httpInterceptor.wrapHttpServer(server);
  }
  /**
   * Measure a function's performance
   */
  async measure(operationName, fn, context) {
    return this.performanceMonitor.measure(operationName, fn, context);
  }
  /**
   * Start measuring an operation
   */
  startMeasure(operationName) {
    this.performanceMonitor.startMeasure(operationName);
  }
  /**
   * End measurement
   */
  async endMeasure(operationName, context) {
    await this.performanceMonitor.endMeasure(operationName, context);
  }
  /**
   * Manually capture an error
   */
  async captureError(error, context) {
    await this.errorInterceptor.captureError(error, context);
  }
  /**
   * Track an outgoing HTTP request
   */
  trackHttpRequest(url, options) {
    return this.httpInterceptor.trackOutgoingRequest(url, options);
  }
  /**
   * Get performance monitor (for decorators)
   */
  get performance() {
    return this.performanceMonitor;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ErrorInterceptor,
  ExternalResourceMonitor,
  HttpInterceptor,
  Instrumentation,
  MetricAggregator,
  PerformanceMonitor,
  PrometheusExporter,
  SystemMetricsCollector
});
