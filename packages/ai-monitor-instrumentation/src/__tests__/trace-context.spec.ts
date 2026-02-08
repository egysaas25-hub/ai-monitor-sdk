import { TraceContext, traceMiddleware } from '../trace-context';

describe('TraceContext', () => {
  describe('generateTraceId()', () => {
    it('returns a 32-char hex string', () => {
      const id = TraceContext.generateTraceId();
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    });

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => TraceContext.generateTraceId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('generateSpanId()', () => {
    it('returns a 16-char hex string', () => {
      const id = TraceContext.generateSpanId();
      expect(id).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe('createTraceparent()', () => {
    it('creates valid W3C traceparent header', () => {
      const header = TraceContext.createTraceparent({
        traceId: 'a'.repeat(32),
        spanId: 'b'.repeat(16),
        sampled: true,
      });
      expect(header).toBe(`00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`);
    });

    it('sets flags to 00 when not sampled', () => {
      const header = TraceContext.createTraceparent({
        traceId: 'a'.repeat(32),
        spanId: 'b'.repeat(16),
        sampled: false,
      });
      expect(header).toMatch(/-00$/);
    });
  });

  describe('parseTraceparent()', () => {
    it('parses a valid traceparent header', () => {
      const traceId = 'a'.repeat(32);
      const spanId = 'b'.repeat(16);
      const header = `00-${traceId}-${spanId}-01`;

      const ctx = TraceContext.parseTraceparent(header);

      expect(ctx).not.toBeNull();
      expect(ctx!.traceId).toBe(traceId);
      expect(ctx!.spanId).toBe(spanId);
      expect(ctx!.sampled).toBe(true);
    });

    it('returns null for invalid header', () => {
      expect(TraceContext.parseTraceparent('invalid')).toBeNull();
      expect(TraceContext.parseTraceparent('01-abc-def-01')).toBeNull(); // wrong version
      expect(TraceContext.parseTraceparent('00-short-short-01')).toBeNull(); // too short
    });
  });

  describe('AsyncLocalStorage context', () => {
    it('stores and retrieves context via run()', () => {
      const ctx = {
        traceId: TraceContext.generateTraceId(),
        spanId: TraceContext.generateSpanId(),
        sampled: true,
      };

      TraceContext.run(ctx, () => {
        expect(TraceContext.current()).toEqual(ctx);
        expect(TraceContext.currentTraceId()).toBe(ctx.traceId);
      });
    });

    it('returns undefined outside of a run()', () => {
      expect(TraceContext.current()).toBeUndefined();
    });
  });

  describe('createChildSpan()', () => {
    it('creates child span with same traceId', () => {
      const parentCtx = {
        traceId: TraceContext.generateTraceId(),
        spanId: TraceContext.generateSpanId(),
        sampled: true,
      };

      TraceContext.run(parentCtx, () => {
        const child = TraceContext.createChildSpan();
        expect(child).not.toBeNull();
        expect(child!.traceId).toBe(parentCtx.traceId);
        expect(child!.parentSpanId).toBe(parentCtx.spanId);
        expect(child!.spanId).not.toBe(parentCtx.spanId);
      });
    });

    it('returns null when no active trace', () => {
      expect(TraceContext.createChildSpan()).toBeNull();
    });
  });
});

describe('traceMiddleware()', () => {
  const middleware = traceMiddleware();

  it('generates a fresh trace when no incoming header', (done) => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };

    middleware(req, res, () => {
      expect(req.traceId).toBeDefined();
      expect(req.traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(req.traceContext).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('traceparent', expect.any(String));
      done();
    });
  });

  it('propagates incoming traceparent header', (done) => {
    const incomingTraceId = 'a'.repeat(32);
    const incoming = `00-${incomingTraceId}-${'b'.repeat(16)}-01`;
    const req: any = { headers: { traceparent: incoming } };
    const res: any = { setHeader: jest.fn() };

    middleware(req, res, () => {
      expect(req.traceId).toBe(incomingTraceId);
      expect(req.traceContext.parentSpanId).toBe('b'.repeat(16));
      done();
    });
  });

  it('makes trace accessible via TraceContext.current() inside handler', (done) => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };

    middleware(req, res, () => {
      expect(TraceContext.current()).toBeDefined();
      expect(TraceContext.currentTraceId()).toBe(req.traceId);
      done();
    });
  });
});
