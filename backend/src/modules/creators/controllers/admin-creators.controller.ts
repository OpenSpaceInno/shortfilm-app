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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreatorsService } from '../services/creators.service';
import {
  CreatorQueryDto,
  PaginatedCreatorsDto,
  CreatorResponseDto,
  ReviewCreatorApplicationDto,
  CreatorApplicationResponseDto,
  ReviewCreatorVerificationDto,
  CreatorVerificationResponseDto,
  CreateCreatorInternalNoteDto,
  CreatorInternalNoteDto,
  UpdateCreatorStatusDto,
  UpdateCreatorTierDto,
  ReviewSubmissionDto,
  SubmissionQueryDto,
  CreatorSubmissionResponseDto,
  PaginatedSubmissionsDto,
  RunSettlementDto,
  SettlementRunResultDto,
  CreatorEarningsQueryDto,
  PaginatedCreatorEarningsDto,
  UpdateEarningsStatusDto,
  CreatorEarningsResponseDto,
  CreatorAnalyticsOverviewDto,
  CreatorRetentionAnalyticsDto,
  CreatorChoiceAnalyticsDto,
  CreatorContentPerformanceDto,
  CreatorAnalyticsQueryDto,
} from '../dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { ApplicationStatus } from '../../../database/schema';
import { CreatorEarningsService } from '../services/creator-earnings.service';
import { CreatorAnalyticsService } from '../services/creator-analytics.service';

@ApiTags('admin-creators')
@Controller('admin/creators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'CREATOR_MANAGER')
@ApiBearerAuth()
export class AdminCreatorsController {
  constructor(
    private readonly creatorsService: CreatorsService,
    private readonly earningsService: CreatorEarningsService,
    private readonly analyticsService: CreatorAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin list all creators with moderation states & filters' })
  @ApiResponse({ status: 200, description: 'Paginated creators directory' })
  async listCreators(
    @Query() query: CreatorQueryDto,
  ): Promise<ApiResponseDto<PaginatedCreatorsDto>> {
    const result = await this.creatorsService.getPublicCreators(query);
    return new ApiResponseDto(result);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Admin list creator applications review queue' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Application review queue' })
  async listApplications(
    @Query('status') status?: ApplicationStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiResponseDto<{ items: CreatorApplicationResponseDto[]; total: number }>> {
    const result = await this.creatorsService.getAdminApplications({
      status,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    return new ApiResponseDto(result);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Admin get application pitch & submission detail' })
  @ApiResponse({ status: 200, description: 'Application detail' })
  async getApplication(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorApplicationResponseDto>> {
    const result = await this.creatorsService.getApplicationById(id);
    return new ApiResponseDto(result);
  }

  @Post('applications/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin review application (Approve promotes user to CREATOR role)' })
  @ApiResponse({ status: 200, description: 'Application review completed' })
  async reviewApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewCreatorApplicationDto,
  ): Promise<ApiResponseDto<CreatorApplicationResponseDto>> {
    const result = await this.creatorsService.reviewApplication(id, user.id, dto);
    return new ApiResponseDto(result);
  }

  @Post('verifications/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin review KYC verification document request' })
  @ApiResponse({ status: 200, description: 'Verification reviewed' })
  async reviewVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewCreatorVerificationDto,
  ): Promise<ApiResponseDto<CreatorVerificationResponseDto>> {
    const result = await this.creatorsService.reviewVerification(id, user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Admin list submissions in editorial review queue (M17)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'submissionType', required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Editorial review queue' })
  async listSubmissions(
    @Query() query: SubmissionQueryDto,
  ): Promise<ApiResponseDto<PaginatedSubmissionsDto>> {
    const result = await this.creatorsService.getAdminSubmissions(query);
    return new ApiResponseDto(result);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Admin get full submission detail & checklist (M17)' })
  @ApiResponse({ status: 200, description: 'Submission detail' })
  async getSubmission(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorSubmissionResponseDto>> {
    const result = await this.creatorsService.getSubmissionById(id, undefined, true);
    return new ApiResponseDto(result);
  }

  @Post('submissions/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin review submission (Approve, Request Changes, Publish, Reject) (M17)' })
  @ApiResponse({ status: 200, description: 'Submission review decision recorded' })
  async reviewSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
  ): Promise<ApiResponseDto<CreatorSubmissionResponseDto>> {
    const result = await this.creatorsService.reviewSubmission(user.id, id, dto);
    return new ApiResponseDto(result);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin update creator lifecycle status (Suspend, Activate, Deactivate)' })
  @ApiResponse({ status: 200, description: 'Creator status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCreatorStatusDto,
  ): Promise<ApiResponseDto<CreatorResponseDto>> {
    const result = await this.creatorsService.updateCreatorStatus(id, dto);
    return new ApiResponseDto(result);
  }

  @Patch(':id/tier')
  @ApiOperation({ summary: 'Admin update creator tier level (Emerging, Verified, Exclusive, Partner)' })
  @ApiResponse({ status: 200, description: 'Creator tier updated' })
  async updateTier(
    @Param('id') id: string,
    @Body() dto: UpdateCreatorTierDto,
  ): Promise<ApiResponseDto<CreatorResponseDto>> {
    const result = await this.creatorsService.updateCreatorTier(id, dto);
    return new ApiResponseDto(result);
  }

  @Post('earnings/settlement')
  @ApiOperation({ summary: 'Admin trigger monthly settlement worker calculation (M19)' })
  @ApiResponse({ status: 200, type: SettlementRunResultDto })
  async runSettlement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RunSettlementDto,
  ): Promise<ApiResponseDto<SettlementRunResultDto>> {
    const result = await this.earningsService.runMonthlySettlement(dto, user.id);
    return new ApiResponseDto(result);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Admin list all creator monthly earnings with filters (M19)' })
  @ApiResponse({ status: 200, type: PaginatedCreatorEarningsDto })
  async listEarnings(
    @Query() query: CreatorEarningsQueryDto,
  ): Promise<ApiResponseDto<PaginatedCreatorEarningsDto>> {
    const result = await this.earningsService.getAdminEarnings(query);
    return new ApiResponseDto(result);
  }

  @Patch('earnings/:id/status')
  @ApiOperation({
    summary: 'Admin transition earnings record status (CALCULATED -> PENDING_PAYOUT -> PAID / HELD) (M19)',
  })
  @ApiResponse({ status: 200, type: CreatorEarningsResponseDto })
  async updateEarningsStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEarningsStatusDto,
  ): Promise<ApiResponseDto<CreatorEarningsResponseDto>> {
    const result = await this.earningsService.updateEarningsStatus(id, dto, user.id);
    return new ApiResponseDto(result);
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin add internal operational note for a creator' })
  @ApiResponse({ status: 201, description: 'Note added' })
  async addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCreatorInternalNoteDto,
  ): Promise<ApiResponseDto<CreatorInternalNoteDto>> {
    const result = await this.creatorsService.addInternalNote(id, user.id, dto);
    return new ApiResponseDto(result);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Admin get internal commentary history for a creator' })
  @ApiResponse({ status: 200, description: 'Internal notes history' })
  async getNotes(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorInternalNoteDto[]>> {
    const result = await this.creatorsService.getInternalNotes(id);
    return new ApiResponseDto(result);
  }

  @Get(':id/analytics/overview')
  @ApiOperation({ summary: 'Admin get creator-scoped engagement telemetry and trend analytics (M20)' })
  @ApiResponse({ status: 200, type: CreatorAnalyticsOverviewDto })
  async getCreatorAnalyticsOverview(
    @Param('id') id: string,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorAnalyticsOverviewDto>> {
    const result = await this.analyticsService.getOverview(id, query);
    return new ApiResponseDto(result);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Admin get creator-scoped analytics dashboard overview (alias) (M20)' })
  @ApiResponse({ status: 200, type: CreatorAnalyticsOverviewDto })
  async getCreatorAnalytics(
    @Param('id') id: string,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorAnalyticsOverviewDto>> {
    const result = await this.analyticsService.getOverview(id, query);
    return new ApiResponseDto(result);
  }

  @Get(':id/analytics/retention')
  @ApiOperation({ summary: 'Admin get retention curves and drop-off analysis across episodes (M20)' })
  @ApiResponse({ status: 200, type: CreatorRetentionAnalyticsDto })
  async getCreatorRetention(
    @Param('id') id: string,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorRetentionAnalyticsDto>> {
    const result = await this.analyticsService.getRetention(id, query);
    return new ApiResponseDto(result);
  }

  @Get(':id/analytics/choices')
  @ApiOperation({ summary: 'Admin get choice decision distributions and consensus metrics (M20)' })
  @ApiResponse({ status: 200, type: CreatorChoiceAnalyticsDto })
  async getCreatorChoices(
    @Param('id') id: string,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorChoiceAnalyticsDto>> {
    const result = await this.analyticsService.getChoices(id, query);
    return new ApiResponseDto(result);
  }

  @Get(':id/analytics/stories')
  @ApiOperation({ summary: 'Admin get catalog performance ranking by views, completion and revenue (M20)' })
  @ApiResponse({ status: 200, type: CreatorContentPerformanceDto })
  async getCreatorStoryPerformance(
    @Param('id') id: string,
    @Query() query: CreatorAnalyticsQueryDto,
  ): Promise<ApiResponseDto<CreatorContentPerformanceDto>> {
    const result = await this.analyticsService.getStoryPerformance(id, query);
    return new ApiResponseDto(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin get full creator profile with extended metadata' })
  @ApiResponse({ status: 200, description: 'Creator full detail' })
  async getCreator(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatorResponseDto>> {
    const result = await this.creatorsService.getCreatorById(id);
    return new ApiResponseDto(result);
  }
}
