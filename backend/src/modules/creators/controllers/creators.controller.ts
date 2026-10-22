import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreatorsService } from '../services/creators.service';
import {
  CreatorQueryDto,
  PaginatedCreatorsDto,
  CreatorResponseDto,
  UpdateCreatorProfileDto,
  SubmitCreatorApplicationDto,
  CreatorApplicationResponseDto,
  SubmitCreatorVerificationDto,
  CreatorVerificationResponseDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  SubmissionQueryDto,
  CreatorSubmissionResponseDto,
  PaginatedSubmissionsDto,
  CreatorEarningsQueryDto,
  PaginatedCreatorEarningsDto,
  CreatorEarningsSummaryDto,
  CreatorAnalyticsOverviewDto,
  CreatorRetentionAnalyticsDto,
  CreatorChoiceAnalyticsDto,
  CreatorContentPerformanceDto,
  CreatorAnalyticsQueryDto,
} from '../dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { CreatorEarningsService } from '../services/creator-earnings.service';
import { CreatorAnalyticsService } from '../services/creator-analytics.service';

@ApiTags('creators')
@Controller('creators')
export class CreatorsController {
  constructor(
    private readonly creatorsService: CreatorsService,
    private readonly earningsService: CreatorEarningsService,
    private readonly analyticsService: CreatorAnalyticsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public discovery catalog of verified creators' })
  @ApiResponse({ status: 200, description: 'Paginated creators directory' })
  async getCreators(
    @Query() query: CreatorQueryDto,
  ): Promise<ApiResponseDto<PaginatedCreatorsDto>> {
    const result = await this.creatorsService.getPublicCreators(query);
    return new ApiResponseDto(result);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user own creator profile' })
  @ApiResponse({ status: 200, description: 'Authenticated creator profile' })
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<CreatorResponseDto>> {
    const result = await this.creatorsService.getMyCreatorProfile(user.id);
    return new ApiResponseDto(result);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unified creator studio workspace dashboard (P9.1 / M16 / M17 / M19 / M20)' })
  @ApiResponse({ status: 200, description: 'Creator Studio Dashboard aggregated metrics and recent items' })
  async getMyDashboard(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.creatorsService.getMyDashboard(user.id);
    return new ApiResponseDto(result);
  }

  @Get('me/stories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all stories owned by authenticated creator' })
  @ApiResponse({ status: 200, description: 'Creator stories list' })
  async getMyStories(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<any[]>> {
    const result = await this.creatorsService.getMyStories(user.id);
    return new ApiResponseDto(result);
  }

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get monthly earnings ledger for authenticated creator (M19)' })
  @ApiResponse({ status: 200, type: PaginatedCreatorEarningsDto })
  async getMyEarnings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreatorEarningsQueryDto,
  ): Promise<ApiResponseDto<PaginatedCreatorEarningsDto>> {
    const result = await this.earningsService.getCreatorEarnings(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('me/earnings/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get earnings summary metrics for authenticated creator (M19)' })
  @ApiResponse({ status: 200, type: CreatorEarningsSummaryDto })
  async getMyEarningsSummary(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<CreatorEarningsSummaryDto>> {
    const result = await this.earningsService.getCreatorEarningsSummary(user.id);
    return new ApiResponseDto(result);
  }

  @Get('me/analytics/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator-scoped engagement telemetry and trend analytics (M20)' })
  @ApiResponse({ status: 200, type: CreatorAnalyticsOverviewDto })
  async getMyAnalyticsOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorAnalyticsOverviewDto>> {
    const result = await this.analyticsService.getOverviewForUser(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('me/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator-scoped analytics dashboard overview (alias) (M20)' })
  @ApiResponse({ status: 200, type: CreatorAnalyticsOverviewDto })
  async getMyAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorAnalyticsOverviewDto>> {
    const result = await this.analyticsService.getOverviewForUser(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('me/analytics/retention')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get retention curves and drop-off analysis across episodes (M20)' })
  @ApiResponse({ status: 200, type: CreatorRetentionAnalyticsDto })
  async getMyRetentionAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorRetentionAnalyticsDto>> {
    const result = await this.analyticsService.getRetentionForUser(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('me/analytics/choices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get choice decision distributions and consensus metrics (M20)' })
  @ApiResponse({ status: 200, type: CreatorChoiceAnalyticsDto })
  async getMyChoiceAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorChoiceAnalyticsDto>> {
    const result = await this.analyticsService.getChoicesForUser(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('me/analytics/stories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get catalog performance ranking by views, completion and revenue (M20)' })
  @ApiResponse({ status: 200, type: CreatorContentPerformanceDto })
  async getMyStoryPerformance(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorContentPerformanceDto>> {
    const result = await this.analyticsService.getStoryPerformanceForUser(user.id, query);
    return new ApiResponseDto(result);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update authenticated creator branding & profile metadata' })
  @ApiResponse({ status: 200, description: 'Updated creator profile' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCreatorProfileDto,
  ): Promise<ApiResponseDto<CreatorResponseDto>> {
    const result = await this.creatorsService.updateMyCreatorProfile(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit creator onboarding application with showreel & story pitch' })
  @ApiResponse({ status: 201, description: 'Application registered in review pipeline' })
  async submitApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitCreatorApplicationDto,
  ): Promise<ApiResponseDto<CreatorApplicationResponseDto>> {
    const result = await this.creatorsService.submitApplication(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of creator applications submitted by authenticated user' })
  @ApiResponse({ status: 200, description: 'User applications list' })
  async getMyApplications(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<CreatorApplicationResponseDto[]>> {
    const result = await this.creatorsService.getMyApplications(user.id);
    return new ApiResponseDto(result);
  }

  @Post('me/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit KYC identity/business document for verification badge' })
  @ApiResponse({ status: 200, description: 'Verification request created' })
  async submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitCreatorVerificationDto,
  ): Promise<ApiResponseDto<CreatorVerificationResponseDto>> {
    const result = await this.creatorsService.submitVerification(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Post('submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create story / series submission pitch (M17)' })
  @ApiResponse({ status: 201, description: 'Submission draft created' })
  async createSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubmissionDto,
  ): Promise<ApiResponseDto<CreatorSubmissionResponseDto>> {
    const result = await this.creatorsService.createSubmission(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get('submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List submissions submitted by authenticated creator (M17)' })
  @ApiResponse({ status: 200, description: 'Creator submissions list' })
  async getMySubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SubmissionQueryDto,
  ): Promise<ApiResponseDto<PaginatedSubmissionsDto>> {
    const result = await this.creatorsService.getMySubmissions(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('submissions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get submission detail for authenticated creator (M17)' })
  @ApiResponse({ status: 200, description: 'Submission detail' })
  async getSubmissionById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorSubmissionResponseDto>> {
    const result = await this.creatorsService.getSubmissionById(id, user.id, false);
    return new ApiResponseDto(result);
  }

  @Patch('submissions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update draft or revised submission (M17)' })
  @ApiResponse({ status: 200, description: 'Updated submission' })
  async updateSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
  ): Promise<ApiResponseDto<CreatorSubmissionResponseDto>> {
    const result = await this.creatorsService.updateSubmission(user.id, id, dto);
    return new ApiResponseDto(result);
  }

  @Post('submissions/:id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit submission into review queue (M17)' })
  @ApiResponse({ status: 200, description: 'Submission submitted for review' })
  async submitForReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorSubmissionResponseDto>> {
    const result = await this.creatorsService.submitSubmission(user.id, id);
    return new ApiResponseDto(result);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Public detail view of a creator profile' })
  @ApiResponse({ status: 200, description: 'Creator profile detail' })
  async getCreatorById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorResponseDto>> {
    const result = await this.creatorsService.getCreatorById(id);
    return new ApiResponseDto(result);
  }
}
