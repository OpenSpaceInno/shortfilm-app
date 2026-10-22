import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CorsConfigService } from './services/cors-config.service';
import { SecurityAuditService } from './services/security-audit.service';
import { AppThrottlerGuard } from './guards/app-throttler.guard';
import { SecurityController } from './controllers/security.controller';
import { RATE_LIMIT_TIERS } from './constants/security.constants';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: RATE_LIMIT_TIERS.default.name,
        ttl: RATE_LIMIT_TIERS.default.ttl,
        limit: RATE_LIMIT_TIERS.default.limit,
      },
      {
        name: RATE_LIMIT_TIERS.auth.name,
        ttl: RATE_LIMIT_TIERS.auth.ttl,
        limit: RATE_LIMIT_TIERS.auth.limit,
      },
      {
        name: RATE_LIMIT_TIERS.ai.name,
        ttl: RATE_LIMIT_TIERS.ai.ttl,
        limit: RATE_LIMIT_TIERS.ai.limit,
      },
      {
        name: RATE_LIMIT_TIERS.analytics.name,
        ttl: RATE_LIMIT_TIERS.analytics.ttl,
        limit: RATE_LIMIT_TIERS.analytics.limit,
      },
    ]),
  ],
  controllers: [SecurityController],
  providers: [
    CorsConfigService,
    SecurityAuditService,
    AppThrottlerGuard,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
  exports: [
    CorsConfigService,
    SecurityAuditService,
    AppThrottlerGuard,
    ThrottlerModule,
  ],
})
export class SecurityModule {}
