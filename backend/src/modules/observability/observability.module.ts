import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CorrelationContextService } from './services/correlation-context.service';
import { MetricsService } from './services/metrics.service';
import { TracingService } from './services/tracing.service';
import { AppLoggerService } from './services/app-logger.service';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { TracingInterceptor } from './interceptors/tracing.interceptor';
import { MetricsController } from './controllers/metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    CorrelationContextService,
    MetricsService,
    TracingService,
    AppLoggerService,
    CorrelationIdMiddleware,
    MetricsInterceptor,
    TracingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
  exports: [
    CorrelationContextService,
    MetricsService,
    TracingService,
    AppLoggerService,
    CorrelationIdMiddleware,
    MetricsInterceptor,
    TracingInterceptor,
  ],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
