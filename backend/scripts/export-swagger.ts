import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

async function generateOpenApiSpec() {
  console.log('Building NestJS application context for Swagger export...');
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

  // Match main.ts configuration
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

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
    .addTag('Performance', 'Cache inspection and query execution plans')
    .addTag('Security', 'Security audit and header inspection')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  const outputPathBackend = path.resolve(__dirname, '../openapi.json');
  const outputPathFrontend = path.resolve(__dirname, '../../src/lib/api-client/openapi.json');

  fs.mkdirSync(path.dirname(outputPathFrontend), { recursive: true });

  const specJson = JSON.stringify(document, null, 2);
  fs.writeFileSync(outputPathBackend, specJson);
  fs.writeFileSync(outputPathFrontend, specJson);

  console.log(`✅ OpenAPI specification exported successfully:`);
  console.log(`   - Backend:  ${outputPathBackend}`);
  console.log(`   - Frontend: ${outputPathFrontend}`);

    await app.close();
    process.exit(0);
  } catch (err) {
    console.error('Error inside generateOpenApiSpec:', err);
    throw err;
  }
}

generateOpenApiSpec().catch((err) => {
  console.error('Failed to export OpenAPI specification:', err);
  process.exit(1);
});
