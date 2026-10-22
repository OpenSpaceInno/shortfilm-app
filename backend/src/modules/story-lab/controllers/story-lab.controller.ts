import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoryLabService } from '../services/story-lab.service';
import {
  QueryStorySignalsDto,
  QueryStoryInsightsDto,
  QueryContentOpportunitiesDto,
  QueryStoryExperimentsDto,
} from '../dto/query-story-lab.dto';
import { CreateExperimentDto } from '../dto/create-experiment.dto';
import { UpdateExperimentStatusDto, UpdateExperimentDto } from '../dto/update-experiment.dto';
import { AllocateVariantRequestDto } from '../dto/variant-allocation.dto';
import { UpdateInsightStatusDto, GenerateInsightsRequestDto } from '../dto/story-insights.dto';
import { UpdateOpportunityStatusDto } from '../dto/content-opportunity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Story Lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('story-lab')
export class StoryLabController {
  constructor(private readonly storyLabService: StoryLabService) {}

  // -------------------------------------------------------------------------
  // Signals
  // -------------------------------------------------------------------------

  @Get('signals')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'List detected story behavioral signals', description: 'Fetch friction, monopoly, and drop-off signals' })
  @ApiResponse({ status: 200, description: 'Signals list retrieved' })
  async getSignals(@Query() query: QueryStorySignalsDto) {
    const data = await this.storyLabService.getSignals(query);
    return { success: true, data };
  }

  @Get('signals/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Get story signal by ID' })
  async getSignalById(@Param('id') id: string) {
    const data = await this.storyLabService.getSignalById(id);
    return { success: true, data };
  }

  @Post('signals/detect/:storyId')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Trigger anomaly signal detection for story' })
  async detectSignalsForStory(@Param('storyId') storyId: string) {
    const data = await this.storyLabService.detectSignalsForStory(storyId);
    return { success: true, data };
  }

  // -------------------------------------------------------------------------
  // Insights
  // -------------------------------------------------------------------------

  @Get('insights')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'List narrative insights' })
  async getInsights(@Query() query: QueryStoryInsightsDto) {
    const data = await this.storyLabService.getInsights(query);
    return { success: true, data };
  }

  @Get('insights/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Get story insight by ID' })
  async getInsightById(@Param('id') id: string) {
    const data = await this.storyLabService.getInsightById(id);
    return { success: true, data };
  }

  @Patch('insights/:id/status')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Update insight review status' })
  async updateInsightStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInsightStatusDto,
  ) {
    const data = await this.storyLabService.updateInsightStatus(id, dto);
    return { success: true, data };
  }

  @Post('insights/generate')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Generate narrative insights from high-confidence signals' })
  async generateInsights(@Body() dto: GenerateInsightsRequestDto) {
    const data = await this.storyLabService.generateInsights(dto);
    return { success: true, data };
  }

  // -------------------------------------------------------------------------
  // Content Opportunities
  // -------------------------------------------------------------------------

  @Get('opportunities')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'List content opportunities' })
  async getOpportunities(@Query() query: QueryContentOpportunitiesDto) {
    const data = await this.storyLabService.getOpportunities(query);
    return { success: true, data };
  }

  @Get('opportunities/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Get content opportunity by ID' })
  async getOpportunityById(@Param('id') id: string) {
    const data = await this.storyLabService.getOpportunityById(id);
    return { success: true, data };
  }

  @Patch('opportunities/:id/status')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Update opportunity review status' })
  async updateOpportunityStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityStatusDto,
  ) {
    const data = await this.storyLabService.updateOpportunityStatus(id, dto);
    return { success: true, data };
  }

  // -------------------------------------------------------------------------
  // Experiments & A/B Allocation
  // -------------------------------------------------------------------------

  @Get('experiments')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'List story A/B experiments' })
  async getExperiments(@Query() query: QueryStoryExperimentsDto) {
    const data = await this.storyLabService.getExperiments(query);
    return { success: true, data };
  }

  @Get('experiments/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Get story experiment with variants by ID' })
  async getExperimentById(@Param('id') id: string) {
    const data = await this.storyLabService.getExperimentById(id);
    return { success: true, data };
  }

  @Post('experiments')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Create new A/B story experiment' })
  async createExperiment(@Body() dto: CreateExperimentDto, @Req() req: any) {
    const creatorUserId = req?.user?.id;
    const data = await this.storyLabService.createExperiment(dto, creatorUserId);
    return { success: true, data };
  }

  @Patch('experiments/:id/status')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Transition experiment status (SCHEDULED, RUNNING, PAUSED, CONCLUDED)' })
  async updateExperimentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExperimentStatusDto,
  ) {
    const data = await this.storyLabService.updateExperimentStatus(id, dto);
    return { success: true, data };
  }

  @Patch('experiments/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Update experiment attributes' })
  async updateExperiment(
    @Param('id') id: string,
    @Body() dto: UpdateExperimentDto,
  ) {
    const data = await this.storyLabService.updateExperiment(id, dto);
    return { success: true, data };
  }

  @Post('experiments/allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deterministically allocate user to Variant A or B' })
  async allocateVariant(@Body() dto: AllocateVariantRequestDto) {
    const data = await this.storyLabService.allocateVariant(dto);
    return { success: true, data };
  }

  @Post('experiments/variants/:id/impression')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record impression for experiment variant' })
  async recordVariantImpression(@Param('id') id: string) {
    await this.storyLabService.recordVariantImpression(id);
    return { success: true };
  }

  @Post('experiments/variants/:id/completion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record completion for experiment variant and check failsafe' })
  async recordVariantCompletion(
    @Param('id') id: string,
    @Query('experimentId') experimentId?: string,
  ) {
    await this.storyLabService.recordVariantCompletion(id, experimentId);
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // Story Node Heatmaps & Audience Path Clustering
  // -------------------------------------------------------------------------

  @Get('heatmaps/:storyId')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Get story node heatmap with drop-off and completion scores' })
  async getStoryNodeHeatmap(@Param('storyId') storyId: string) {
    const data = await this.storyLabService.getStoryNodeHeatmap(storyId);
    return { success: true, data };
  }

  @Get('clusters/:storyId')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Get audience path clusters for interactive story' })
  async getStoryPathClustering(@Param('storyId') storyId: string) {
    const data = await this.storyLabService.getStoryPathClustering(storyId);
    return { success: true, data };
  }
}
