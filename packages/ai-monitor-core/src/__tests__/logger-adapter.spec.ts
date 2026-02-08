import { ConsoleLogger, WinstonLoggerAdapter } from '../logger-adapter';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger();
  });

  it('logs info messages', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.info('hello');
    expect(spy).toHaveBeenCalledWith('[INFO] hello');
    spy.mockRestore();
  });

  it('logs warn messages', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    logger.warn('caution');
    expect(spy).toHaveBeenCalledWith('[WARN] caution');
    spy.mockRestore();
  });

  it('logs error messages', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('failure');
    expect(spy).toHaveBeenCalledWith('[ERROR] failure');
    spy.mockRestore();
  });

  it('logs debug messages', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation();
    logger.debug('detail');
    expect(spy).toHaveBeenCalledWith('[DEBUG] detail');
    spy.mockRestore();
  });

  it('passes extra metadata through', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.info('msg', { key: 'val' });
    expect(spy).toHaveBeenCalledWith('[INFO] msg', { key: 'val' });
    spy.mockRestore();
  });
});

describe('WinstonLoggerAdapter', () => {
  let fakeWinston: Record<string, jest.Mock>;
  let adapter: WinstonLoggerAdapter;

  beforeEach(() => {
    fakeWinston = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    adapter = new WinstonLoggerAdapter(fakeWinston);
  });

  it('delegates info to winston', () => {
    adapter.info('hello');
    expect(fakeWinston.info).toHaveBeenCalledWith('hello');
  });

  it('delegates warn to winston', () => {
    adapter.warn('caution');
    expect(fakeWinston.warn).toHaveBeenCalledWith('caution');
  });

  it('delegates error to winston', () => {
    adapter.error('failure');
    expect(fakeWinston.error).toHaveBeenCalledWith('failure');
  });

  it('delegates debug to winston', () => {
    adapter.debug('detail');
    expect(fakeWinston.debug).toHaveBeenCalledWith('detail');
  });
});
