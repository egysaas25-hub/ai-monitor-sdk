/**
 * Example: NestJS Integration
 * 
 * This example shows how to integrate AI Monitor into a NestJS application
 * using a custom module and interceptor for automatic monitoring.
 */

import { Module, Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AIMonitor, WinstonLoggerAdapter } from '@aker/ai-monitor-core';
import { TelegramNotifier } from '@aker/ai-monitor-notifiers';
import winston from 'winston';

// AI Monitor Provider
const aiMonitorProvider = {
  provide: 'AI_MONITOR',
  useFactory: async () => {
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    const monitor = new AIMonitor({
      port: 4000,
      logger: new WinstonLoggerAdapter(logger),
      notifiers: [
        new TelegramNotifier({
          token: process.env.TELEGRAM_BOT_TOKEN!,
          chatId: process.env.TELEGRAM_CHAT_ID!
        })
      ]
    });

    await monitor.start();
    return monitor;
  }
};

// Monitoring Interceptor
@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private readonly monitor: AIMonitor) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        
        // Alert on slow requests
        if (duration > 5000) {
          this.monitor.alert({
            severity: 'WARNING',
            title: 'Slow Request',
            message: `${request.method} ${request.url} took ${duration}ms`,
            metrics: { duration, method: request.method, url: request.url }
          });
        }
      }),
      catchError((error) => {
        // Alert on errors
        this.monitor.alert({
          severity: 'CRITICAL',
          title: 'NestJS Error',
          message: error.message,
          metrics: {
            stack: error.stack,
            method: request.method,
            url: request.url,
            body: request.body
          }
        });
        
        return throwError(() => error);
      })
    );
  }
}

// Monitoring Module
@Module({
  providers: [
    aiMonitorProvider,
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitoringInterceptor,
      inject: ['AI_MONITOR']
    }
  ],
  exports: ['AI_MONITOR']
})
export class MonitoringModule {}

// Usage in your app.module.ts:
// @Module({
//   imports: [MonitoringModule],
//   // ... other imports
// })
// export class AppModule {}

// Usage in controllers/services:
// @Injectable()
// export class SomeService {
//   constructor(@Inject('AI_MONITOR') private monitor: AIMonitor) {}
//
//   async someMethod() {
//     await this.monitor.alert({
//       severity: 'INFO',
//       title: 'Custom Event',
//       message: 'Something happened'
//     });
//   }
// }
