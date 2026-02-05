import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Valid Prometheus metric types
 */
type MetricType = 'counter' | 'gauge' | 'histogram';

interface IMetric {
  name: string;
  help: string;
  type: MetricType;
  values: Map<string, number>; // key (labels) -> value
}

/**
 * Simple Prometheus Exporter
 * Zero-dependency implementation to expose /metrics
 */
export class PrometheusExporter {
  private metrics: Map<string, IMetric> = new Map();

  constructor() {
    // Initialize standard metrics
    this.register('http_request_duration_seconds', 'HTTP request duration in seconds', 'histogram');
    this.register('http_requests_total', 'Total number of HTTP requests', 'counter');
    this.register('process_cpu_usage_ratio', 'Process CPU usage ratio', 'gauge');
    this.register('process_memory_usage_bytes', 'Process memory usage in bytes', 'gauge');
    this.register('db_connections_active', 'Number of active database connections', 'gauge');
    this.register('job_queue_length', 'Current number of jobs in queue', 'gauge');
  }

  register(name: string, help: string, type: MetricType): void {
    this.metrics.set(name, { name, help, type, values: new Map() });
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric) return;

    const key = this.serializeLabels(labels);

    if (metric.type === 'histogram') {
      // For simplicity in this zero-dependency version, we just store the sum and count
      // A full histogram implementation would require buckets
      const sumKey = this.serializeLabels({ ...labels });
      const currentSum = metric.values.get(sumKey + '_sum') || 0;
      const currentCount = metric.values.get(sumKey + '_count') || 0;
      metric.values.set(sumKey + '_sum', currentSum + value);
      metric.values.set(sumKey + '_count', currentCount + 1);
    } else if (metric.type === 'counter') {
      const current = metric.values.get(key) || 0;
      metric.values.set(key, current + value);
    } else {
      // Gauge
      metric.values.set(key, value);
    }
  }

  /**
   * Handle /metrics endpoint
   */
  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const output = this.generateOutput();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(output);
  }

  private generateOutput(): string {
    let output = '';

    for (const [name, metric] of this.metrics) {
      output += `# HELP ${name} ${metric.help}\n`;
      output += `# TYPE ${name} ${metric.type}\n`;

      for (const [key, value] of metric.values) {
        if (metric.type === 'histogram') {
          // Special handling for histogram simulation (sum/count)
           output += `${name}${key.replace('_sum', '')}_sum ${value}\n`;
        } else {
           output += `${name}${key} ${value}\n`;
        }
      }
    }
    return output;
  }

  private serializeLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    return '{' + entries.map(([k, v]) => `${k}="${v}"`).join(',') + '}';
  }
}
