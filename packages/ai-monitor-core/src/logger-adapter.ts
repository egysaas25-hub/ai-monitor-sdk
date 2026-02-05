import type { ILogger } from './types';

/**
 * Default console logger implementation
 * Used when no custom logger is provided
 */
export class ConsoleLogger implements ILogger {
  info(message: string, ...meta: any[]): void {
    console.log(`[INFO] ${message}`, ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    console.warn(`[WARN] ${message}`, ...meta);
  }

  error(message: string, ...meta: any[]): void {
    console.error(`[ERROR] ${message}`, ...meta);
  }

  debug(message: string, ...meta: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...meta);
  }
}

/**
 * Winston logger adapter
 * Adapts winston logger to ILogger interface
 */
export class WinstonLoggerAdapter implements ILogger {
  constructor(private winstonLogger: any) {}

  info(message: string, ...meta: any[]): void {
    this.winstonLogger.info(message, ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    this.winstonLogger.warn(message, ...meta);
  }

  error(message: string, ...meta: any[]): void {
    this.winstonLogger.error(message, ...meta);
  }

  debug(message: string, ...meta: any[]): void {
    this.winstonLogger.debug(message, ...meta);
  }
}
