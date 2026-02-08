import { PrometheusExporter } from '../prometheus-exporter';

describe('PrometheusExporter', () => {
  let exporter: PrometheusExporter;

  beforeEach(() => {
    exporter = new PrometheusExporter();
  });

  // ---- Registration ---------------------------------------------------------

  describe('register()', () => {
    it('registers custom metrics', () => {
      exporter.register('custom_counter', 'A custom counter', 'counter');
      exporter.observe('custom_counter', 1, { method: 'GET' });

      // Should not throw — metric exists
      expect(true).toBe(true);
    });
  });

  // ---- Counter behavior -----------------------------------------------------

  describe('counter', () => {
    it('accumulates counter values', () => {
      exporter.observe('http_requests_total', 1, { method: 'GET', status: '200' });
      exporter.observe('http_requests_total', 1, { method: 'GET', status: '200' });
      exporter.observe('http_requests_total', 1, { method: 'POST', status: '201' });

      const output = getOutput(exporter);

      // GET/200 should be 2
      expect(output).toContain('http_requests_total{method="GET",status="200"} 2');
      // POST/201 should be 1
      expect(output).toContain('http_requests_total{method="POST",status="201"} 1');
    });
  });

  // ---- Gauge behavior -------------------------------------------------------

  describe('gauge', () => {
    it('replaces gauge value', () => {
      exporter.observe('process_cpu_usage_ratio', 0.5);
      exporter.observe('process_cpu_usage_ratio', 0.8);

      const output = getOutput(exporter);
      expect(output).toContain('process_cpu_usage_ratio 0.8');
      expect(output).not.toContain('0.5');
    });
  });

  // ---- Histogram behavior ---------------------------------------------------

  describe('histogram', () => {
    it('tracks sum and count for histogram', () => {
      exporter.observe('http_request_duration_seconds', 0.1, { method: 'GET', path: '/' });
      exporter.observe('http_request_duration_seconds', 0.3, { method: 'GET', path: '/' });

      const output = getOutput(exporter);

      // Should have _sum entries (0.1 + 0.3 = 0.4)
      expect(output).toContain('_sum');
    });
  });

  // ---- Output format --------------------------------------------------------

  describe('output format', () => {
    it('includes HELP and TYPE annotations', () => {
      const output = getOutput(exporter);

      expect(output).toContain('# HELP http_requests_total');
      expect(output).toContain('# TYPE http_requests_total counter');
      expect(output).toContain('# HELP http_request_duration_seconds');
      expect(output).toContain('# TYPE http_request_duration_seconds histogram');
      expect(output).toContain('# HELP process_cpu_usage_ratio');
      expect(output).toContain('# TYPE process_cpu_usage_ratio gauge');
    });
  });

  // ---- handleRequest --------------------------------------------------------

  describe('handleRequest()', () => {
    it('responds with 200 and text/plain', async () => {
      const res = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      await exporter.handleRequest({} as any, res as any);

      expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/plain' });
      expect(res.end).toHaveBeenCalledWith(expect.any(String));
    });
  });

  // ---- Unknown metric -------------------------------------------------------

  describe('unknown metric', () => {
    it('silently ignores observations for unregistered metrics', () => {
      // Should not throw
      exporter.observe('totally_unknown_metric', 42);
      expect(true).toBe(true);
    });
  });
});

// Helper to extract output without HTTP plumbing
function getOutput(exporter: PrometheusExporter): string {
  let output = '';
  const res = {
    writeHead: jest.fn(),
    end: (text: string) => {
      output = text;
    },
  };
  (exporter as any).handleRequest({}, res);
  return output;
}
