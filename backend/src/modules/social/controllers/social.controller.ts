import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SocialService } from '../services/social.service';
import {
  SubmitVoteDto,
  VoteResponseDto,
  ChoiceVoteStatsDto,
  CreatePredictionDto,
  SubmitPredictionDto,
  ResolvePredictionDto,
  PredictionResponseDto,
  CreateFollowDto,
  FollowResponseDto,
  FollowStatusDto,
} from '../dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { FollowTargetType } from '../../../database/schema';

@ApiTags('social')
@Controller('engagement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit audience vote on an interactive choice dilemma' })
  @ApiResponse({ status: 200, description: 'Vote submitted successfully with XP reward' })
  async submitVote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitVoteDto,
  ): Promise<ApiResponseDto<VoteResponseDto>> {
    const result = await this.socialService.submitVote(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get('votes/choice/:choiceId')
  @ApiOperation({ summary: 'Get community voting percentages and stats for a choice' })
  @ApiResponse({ status: 200, description: 'Choice vote statistics' })
  async getChoiceVoteStats(
    @Param('choiceId') choiceId: string,
  ): Promise<ApiResponseDto<ChoiceVoteStatsDto>> {
    const result = await this.socialService.getChoiceVoteStats(choiceId);
    return new ApiResponseDto(result);
  }

  @Post('predictions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit audience prediction wager for upcoming plot turn' })
  @ApiResponse({ status: 200, description: 'Prediction submitted successfully' })
  async submitPrediction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitPredictionDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.socialService.submitPrediction(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get('predictions/story/:storyId')
  @ApiOperation({ summary: 'List active and resolved predictions for a story' })
  @ApiResponse({ status: 200, description: 'List of predictions with user selections' })
  async getStoryPredictions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
  ): Promise<ApiResponseDto<PredictionResponseDto[]>> {
    const result = await this.socialService.getPredictionsForStory(storyId, user.id);
    return new ApiResponseDto(result);
  }

  @Post('predictions/create')
  @UseGuards(RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Create narrative prediction prompt (Creators & Admins)' })
  @ApiResponse({ status: 201, description: 'Prediction created successfully' })
  async createPrediction(
    @Body() dto: CreatePredictionDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.socialService.createPrediction(dto);
    return new ApiResponseDto(result);
  }

  @Post('predictions/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve prediction and distribute reward XP (Creators & Admins)' })
  @ApiResponse({ status: 200, description: 'Prediction resolved and reward XP distributed' })
  async resolvePrediction(
    @Param('id') id: string,
    @Body() dto: ResolvePredictionDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.socialService.resolvePrediction(id, dto);
    return new ApiResponseDto(result);
  }

  @Post('follows')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a creator, character, or story' })
  @ApiResponse({ status: 200, description: 'Follow status updated with XP bonus' })
  async follow(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFollowDto,
  ): Promise<ApiResponseDto<FollowResponseDto>> {
    const result = await this.socialService.follow(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Delete('follows/:targetType/:targetId')
  @ApiOperation({ summary: 'Unfollow a creator, character, or story' })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed target' })
  async unfollow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('targetType') targetType: FollowTargetType,
    @Param('targetId') targetId: string,
  ): Promise<ApiResponseDto<{ success: boolean }>> {
    const result = await this.socialService.unfollow(user.id, targetType, targetId);
    return new ApiResponseDto(result);
  }

  @Get('follows/status')
  @ApiOperation({ summary: 'Check if user is following target and get follower count' })
  @ApiQuery({ name: 'targetType', enum: ['CREATOR', 'CHARACTER', 'STORY'] })
  @ApiQuery({ name: 'targetId', type: String })
  @ApiResponse({ status: 200, description: 'Follow relationship status' })
  async getFollowStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query('targetType') targetType: FollowTargetType,
    @Query('targetId') targetId: string,
  ): Promise<ApiResponseDto<FollowStatusDto>> {
    const result = await this.socialService.getFollowStatus(user.id, targetType, targetId);
    return new ApiResponseDto(result);
  }

  @Get('follows/me')
  @ApiOperation({ summary: 'Get list of entities followed by authenticated user' })
  @ApiResponse({ status: 200, description: 'List of follows' })
  async getUserFollows(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<any[]>> {
    const result = await this.socialService.getUserFollows(user.id);
    return new ApiResponseDto(result);
  }
}
