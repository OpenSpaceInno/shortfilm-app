import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GamificationService } from '../services/gamification.service';
import {
  BadgeDto,
  StreakActivityResponseDto,
  GamificationProfileDto,
  LeaderboardItemDto,
} from '../dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user gamification status, streak, badges and XP' })
  @ApiResponse({ status: 200, description: 'Gamification profile returned successfully' })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<GamificationProfileDto>> {
    const profile = await this.gamificationService.getGamificationSummary(user.id);
    return new ApiResponseDto(profile);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get full catalog of badges with user unlock status' })
  @ApiResponse({ status: 200, description: 'Badge catalog returned successfully' })
  async getBadges(@CurrentUser() user: AuthenticatedUser): Promise<ApiResponseDto<BadgeDto[]>> {
    const badges = await this.gamificationService.getAllBadges(user.id);
    return new ApiResponseDto(badges);
  }

  @Post('streak/ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record daily engagement activity and update streak' })
  @ApiResponse({ status: 200, description: 'Daily streak updated successfully' })
  async pingActivity(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<StreakActivityResponseDto>> {
    const result = await this.gamificationService.recordDailyActivity(user.id);
    return new ApiResponseDto(result);
  }

  @Post('badges/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate and unlock eligible achievement badges' })
  @ApiResponse({ status: 200, description: 'Evaluated badge unlock criteria' })
  async evaluateBadges(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<BadgeDto[]>> {
    const newBadges = await this.gamificationService.evaluateBadges(user.id);
    return new ApiResponseDto(newBadges);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get streak leaderboard ranking top active viewers' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top users (default: 10)' })
  @ApiResponse({ status: 200, description: 'Leaderboard ranking returned successfully' })
  async getLeaderboard(
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<LeaderboardItemDto[]>> {
    const leaderboard = await this.gamificationService.getStreakLeaderboard(
      limit ? Number(limit) : 10,
    );
    return new ApiResponseDto(leaderboard);
  }
}
