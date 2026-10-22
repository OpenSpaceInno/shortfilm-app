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

@ApiTags('Admin Story Lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/story-lab')
export class AdminStoryLabController {
  constructor(private readonly storyLabService: StoryLabService) {}

  @Get('signals')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: List story signals' })
  async getSignals(@Query() query: QueryStorySignalsDto) {
    const data = await this.storyLabService.getSignals(query);
    return { success: true, data };
  }

  @Get('signals/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Get signal by ID' })
  async getSignalById(@Param('id') id: string) {
    const data = await this.storyLabService.getSignalById(id);
    return { success: true, data };
  }

  @Post('signals/detect/:storyId')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Admin: Trigger anomaly signal detection' })
  async detectSignalsForStory(@Param('storyId') storyId: string) {
    const data = await this.storyLabService.detectSignalsForStory(storyId);
    return { success: true, data };
  }

  @Get('insights')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: List narrative insights' })
  async getInsights(@Query() query: QueryStoryInsightsDto) {
    const data = await this.storyLabService.getInsights(query);
    return { success: true, data };
  }

  @Get('insights/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Get insight by ID' })
  async getInsightById(@Param('id') id: string) {
    const data = await this.storyLabService.getInsightById(id);
    return { success: true, data };
  }

  @Patch('insights/:id/status')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Update insight status' })
  async updateInsightStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInsightStatusDto,
  ) {
    const data = await this.storyLabService.updateInsightStatus(id, dto);
    return { success: true, data };
  }

  @Post('insights/generate')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Admin: Generate insights' })
  async generateInsights(@Body() dto: GenerateInsightsRequestDto) {
    const data = await this.storyLabService.generateInsights(dto);
    return { success: true, data };
  }

  @Get('opportunities')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: List opportunities' })
  async getOpportunities(@Query() query: QueryContentOpportunitiesDto) {
    const data = await this.storyLabService.getOpportunities(query);
    return { success: true, data };
  }

  @Get('opportunities/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Get opportunity by ID' })
  async getOpportunityById(@Param('id') id: string) {
    const data = await this.storyLabService.getOpportunityById(id);
    return { success: true, data };
  }

  @Patch('opportunities/:id/status')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Update opportunity status' })
  async updateOpportunityStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityStatusDto,
  ) {
    const data = await this.storyLabService.updateOpportunityStatus(id, dto);
    return { success: true, data };
  }

  @Get('experiments')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: List experiments' })
  async getExperiments(@Query() query: QueryStoryExperimentsDto) {
    const data = await this.storyLabService.getExperiments(query);
    return { success: true, data };
  }

  @Get('experiments/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Get experiment by ID' })
  async getExperimentById(@Param('id') id: string) {
    const data = await this.storyLabService.getExperimentById(id);
    return { success: true, data };
  }

  @Post('experiments')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Admin: Create experiment' })
  async createExperiment(@Body() dto: CreateExperimentDto, @Req() req: any) {
    const creatorUserId = req?.user?.id;
    const data = await this.storyLabService.createExperiment(dto, creatorUserId);
    return { success: true, data };
  }

  @Patch('experiments/:id/status')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Admin: Update experiment status' })
  async updateExperimentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExperimentStatusDto,
  ) {
    const data = await this.storyLabService.updateExperimentStatus(id, dto);
    return { success: true, data };
  }

  @Patch('experiments/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Admin: Update experiment details' })
  async updateExperiment(
    @Param('id') id: string,
    @Body() dto: UpdateExperimentDto,
  ) {
    const data = await this.storyLabService.updateExperiment(id, dto);
    return { success: true, data };
  }

  @Post('experiments/allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Allocate user variant' })
  async allocateVariant(@Body() dto: AllocateVariantRequestDto) {
    const data = await this.storyLabService.allocateVariant(dto);
    return { success: true, data };
  }

  @Get('heatmaps/:storyId')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Get story node heatmap' })
  async getStoryNodeHeatmap(@Param('storyId') storyId: string) {
    const data = await this.storyLabService.getStoryNodeHeatmap(storyId);
    return { success: true, data };
  }

  @Get('clusters/:storyId')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYST', 'EDITOR')
  @ApiOperation({ summary: 'Admin: Get audience path clusters' })
  async getStoryPathClustering(@Param('storyId') storyId: string) {
    const data = await this.storyLabService.getStoryPathClustering(storyId);
    return { success: true, data };
  }
}
