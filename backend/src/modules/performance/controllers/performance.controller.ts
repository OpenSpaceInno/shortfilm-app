import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CacheService, CacheStats } from '../services/cache.service';
import { CacheInvalidationService } from '../services/cache-invalidation.service';
import {
  QueryPlanService,
  ExplainResult,
  IndexAuditReport,
} from '../services/query-plan.service';

export class CachePurgeDto {
  pattern?: string;
  tag?: string;
  storyId?: string;
  userId?: string;
}

export class ExplainQueryDto {
  querySql!: string;
}

@ApiTags('Performance')
@ApiBearerAuth('JWT-auth')
@Controller('admin/performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
export class PerformanceController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheInvalidationService: CacheInvalidationService,
    private readonly queryPlanService: QueryPlanService,
  ) {}

  @Get('cache-stats')
  @ApiOperation({ summary: 'Retrieve live Redis/Memory response cache statistics and hit rates' })
  @ApiResponse({ status: 200, description: 'Cache statistics overview' })
  getCacheStats(): CacheStats {
    return this.cacheService.getStats();
  }

  @Post('cache-purge')
  @ApiOperation({ summary: 'Purge response cache selectively by pattern, story, user, or all' })
  @ApiResponse({ status: 200, description: 'Number of keys purged' })
  async purgeCache(@Body() dto: CachePurgeDto): Promise<{ success: boolean; purgedCount: number; message: string }> {
    let purgedCount = 0;

    if (dto.storyId) {
      await this.cacheInvalidationService.invalidateStory(dto.storyId);
      return { success: true, purgedCount: 1, message: `Story ${dto.storyId} caches purged` };
    }

    if (dto.userId) {
      await this.cacheInvalidationService.invalidateUser(dto.userId);
      return { success: true, purgedCount: 1, message: `User ${dto.userId} caches purged` };
    }

    if (dto.pattern) {
      purgedCount = await this.cacheService.delPattern(dto.pattern);
      return { success: true, purgedCount, message: `Pattern '${dto.pattern}' purged` };
    }

    // Default: purge all application cache
    purgedCount = await this.cacheInvalidationService.purgeAll();
    return { success: true, purgedCount, message: 'All application caches purged' };
  }

  @Get('index-audit')
  @ApiOperation({ summary: 'Audit database tables against SLA critical index requirements' })
  @ApiResponse({ status: 200, description: 'Index verification report' })
  async getIndexAudit(): Promise<IndexAuditReport> {
    return this.queryPlanService.auditIndexes();
  }

  @Post('explain-query')
  @ApiOperation({ summary: 'Run query execution plan analysis and SLA grading' })
  @ApiResponse({ status: 200, description: 'Query plan analysis result' })
  async explainQuery(@Body() dto: ExplainQueryDto): Promise<ExplainResult> {
    return this.queryPlanService.explainQuery(dto.querySql);
  }
}
