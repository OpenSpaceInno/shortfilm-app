import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { CacheInvalidationService } from './services/cache-invalidation.service';
import { QueryPlanService } from './services/query-plan.service';
import { ResponseCacheInterceptor } from './interceptors/response-cache.interceptor';
import { PerformanceController } from './controllers/performance.controller';

@Global()
@Module({
  controllers: [PerformanceController],
  providers: [
    CacheService,
    CacheInvalidationService,
    QueryPlanService,
    ResponseCacheInterceptor,
  ],
  exports: [
    CacheService,
    CacheInvalidationService,
    QueryPlanService,
    ResponseCacheInterceptor,
  ],
})
export class PerformanceModule {}
