import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { createHelmetConfig, CorsConfigService } from './modules/security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const corsConfigService = app.get(CorsConfigService);

  // Use nestjs-pino as primary application logger
  app.useLogger(app.get(Logger));

  // Security Headers via Helmet & Strict CSP
  app.use(helmet(createHelmetConfig(isProduction)));

  // CORS policy validation
  app.enableCors(corsConfigService.getCorsOptions());

  // Support direct root path aliases for Prometheus metrics, health probes, and analytics telemetry
  app.use((req: any, _res: any, next: any) => {
    if (req.url === '/metrics' || req.url.startsWith('/metrics')) {
      req.url = `/api/v1${req.url}`;
    } else if (req.url === '/health' || req.url.startsWith('/health')) {
      req.url = `/api/v1${req.url}`;
    } else if (req.url === '/analytics/events' || req.url.startsWith('/analytics/events')) {
      req.url = `/api/v1${req.url}`;
    }
    next();
  });

  // Global Prefix & API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Pipes & Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // OpenAPI Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ShortReel API')
    .setDescription('Interactive Short-Series Entertainment Platform - Production Modular Monolith REST API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Auth0 RS256 Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System liveness and readiness probes')
    .addTag('Identity', 'User identity and profile management')
    .addTag('Content', 'Stories, seasons, and episodes')
    .addTag('Interactive', 'Story graphs, choices, and branching engine')
    .addTag('Engagement', 'Watch progress, streaks, and user choices')
    .addTag('Creators', 'Creator studio, submissions, and analytics')
    .addTag('Subscriptions', 'Plans, checkout, and entitlement access')
    .addTag('Analytics', 'High-throughput telemetry ingestion and event streaming')
    .addTag('Observability', 'Prometheus metrics and distributed tracing')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  const appLogger = app.get(Logger);
  appLogger.log(`ShortReel Backend initialized and listening on http://localhost:${port}/api/v1`);
  appLogger.log(`Swagger OpenAPI Documentation available at http://localhost:${port}/docs`);
}

bootstrap();
