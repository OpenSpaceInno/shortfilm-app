import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { AdminOverviewStatsDto } from '../dto/admin-dashboard.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin - Centralized CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'CREATOR_MANAGER', 'ANALYST')
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Centralized Administrative CMS Overview (M28)',
    description: 'Rollup of user stats, catalog state, moderation queues, submission backlog, and system health',
  })
  @ApiResponse({ status: 200, type: AdminOverviewStatsDto })
  async getOverview(): Promise<ApiResponseDto<AdminOverviewStatsDto>> {
    const stats = await this.dashboardService.getOverviewStats();
    return new ApiResponseDto(stats);
  }
}
