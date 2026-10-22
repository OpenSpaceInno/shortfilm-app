import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from '../services/engagement.service';
import {
  SyncProgressDto,
  SyncProgressResponseDto,
  WatchHistoryQueryDto,
  WatchHistoryResponseDto,
  ContinueWatchingQueryDto,
  ContinueWatchingItemDto,
  GamificationSummaryDto,
} from '../dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('engagement')
@Controller('engagement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post('progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync playback watch progress (idempotent upsert & completion reward)',
  })
  @ApiResponse({
    status: 200,
    description: 'Watch progress synchronized and XP awarded if newly completed',
  })
  async syncProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SyncProgressDto,
  ): Promise<ApiResponseDto<SyncProgressResponseDto>> {
    const result = await this.engagementService.syncProgress(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get('progress/:episodeId')
  @ApiOperation({ summary: 'Get resume position and current watch progress for an episode' })
  @ApiResponse({ status: 200, description: 'Episode watch progress state' })
  async getProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('episodeId') episodeId: string,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.engagementService.getProgress(user.id, episodeId);
    return new ApiResponseDto(result);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated viewing history of completed episodes' })
  @ApiResponse({ status: 200, description: 'Paginated watch history items' })
  async getWatchHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WatchHistoryQueryDto,
  ): Promise<ApiResponseDto<WatchHistoryResponseDto>> {
    const result = await this.engagementService.getWatchHistory(user.id, query);
    return new ApiResponseDto(result, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
    });
  }

  @Get('continue-watching')
  @ApiOperation({ summary: 'Get user continue watching feed of in-progress stories' })
  @ApiResponse({ status: 200, description: 'List of in-progress episodes with metadata' })
  async getContinueWatching(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ContinueWatchingQueryDto,
  ): Promise<ApiResponseDto<{ items: ContinueWatchingItemDto[] }>> {
    const result = await this.engagementService.getContinueWatching(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('gamification')
  @ApiOperation({ summary: 'Get total XP, badges, streak, and recent points ledger' })
  @ApiResponse({ status: 200, description: 'Gamification summary for current user' })
  async getGamification(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<GamificationSummaryDto>> {
    const result = await this.engagementService.getGamificationSummary(user.id);
    return new ApiResponseDto(result);
  }
}
