import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get('live')
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe - checks if the application process is running' })
  liveness(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - checks if the application is ready to accept traffic' })
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => Promise.resolve({ app: { status: 'up' } }),
    ]);
  }
}
