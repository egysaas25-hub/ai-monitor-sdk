import { ServerlessLifecycle } from '../serverless-hooks';

describe('ServerlessLifecycle', () => {
  let lifecycle: ServerlessLifecycle;

  beforeEach(() => {
    lifecycle = new ServerlessLifecycle();
  });

  it('should detect cold start on first invocation and warm on subsequent', () => {
    const run1 = lifecycle.onInvocationStart();
    expect(run1.isColdStart).toBe(true);
    lifecycle.onInvocationEnd(run1);

    const run2 = lifecycle.onInvocationStart();
    expect(run2.isColdStart).toBe(false);
    lifecycle.onInvocationEnd(run2);

    const metrics = lifecycle.getMetrics();
    expect(metrics.totalInvocations).toBe(2);
    expect(metrics.coldStarts).toBe(1);
    expect(metrics.warmInvocations).toBe(1);
  });

  it('should properly wrap and instrument a handler', async () => {
    const handler = async (event: any) => { return event.msg; };
    const wrapped = lifecycle.wrapHandler(handler);

    const res1 = await wrapped({ msg: 'hello' });
    expect(res1).toBe('hello');

    const metrics = lifecycle.getMetrics();
    expect(metrics.coldStarts).toBe(1);
  });

  it('should execute shutdown handlers', async () => {
    let fired1 = false;
    let fired2 = false;

    lifecycle.onShutdown(async () => { fired1 = true; });
    lifecycle.onShutdown(async () => { fired2 = true; });

    await lifecycle.executeShutdown();

    expect(fired1).toBe(true);
    expect(fired2).toBe(true);
  });
});
