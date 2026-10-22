import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InteractiveService } from '../services/interactive.service';
import { ChoiceEngineService } from '../services/choice-engine.service';
import { StoryLifecycleService } from '../services/story-lifecycle.service';
import { CreateStoryNodeDto, UpdateStoryNodeDto } from '../dto/create-node.dto';
import { CreateChoiceDto, CreateChoiceOptionDto } from '../dto/create-choice.dto';
import { SubmitChoiceDto, ChoiceResolutionResponseDto } from '../dto/submit-choice.dto';
import { RejectVersionDto, VersionTransitionResponseDto } from '../dto/lifecycle.dto';
import { StoryGraphDto } from '../dto/graph-response.dto';
import { GraphValidationResultDto } from '../dto/validation-result.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { StoryVersion, StoryNode, Choice, ChoiceOption, UserChoice } from '../../../database/schema';

@ApiTags('interactive')
@Controller('interactive')
export class InteractiveController {
  constructor(
    private readonly interactiveService: InteractiveService,
    private readonly choiceEngineService: ChoiceEngineService,
    private readonly storyLifecycleService: StoryLifecycleService,
  ) {}

  @Get('stories/:storyId/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all versions of a story' })
  @ApiResponse({ status: 200, description: 'List of story versions' })
  async getStoryVersions(
    @Param('storyId') storyId: string,
  ): Promise<ApiResponseDto<StoryVersion[]>> {
    const versions = await this.interactiveService.getStoryVersions(storyId);
    return new ApiResponseDto(versions);
  }

  @Post('stories/:storyId/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new DRAFT version for a story' })
  @ApiResponse({ status: 201, description: 'Story version created' })
  async createVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
  ): Promise<ApiResponseDto<StoryVersion>> {
    const version = await this.interactiveService.createVersion(user, storyId);
    return new ApiResponseDto(version);
  }

  @Public()
  @Get('stories/:storyId/published-graph')
  @ApiOperation({ summary: 'Get published interactive graph for a story (Public)' })
  @ApiResponse({ status: 200, description: 'Published story graph' })
  @ApiResponse({ status: 404, description: 'No published version found' })
  async getPublishedGraph(
    @Param('storyId') storyId: string,
  ): Promise<ApiResponseDto<StoryGraphDto>> {
    const graph = await this.interactiveService.getPublishedGraphForStory(storyId);
    return new ApiResponseDto(graph);
  }

  @Get('versions/:versionId/graph')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full interactive graph for a specific version' })
  @ApiResponse({ status: 200, description: 'Story version graph' })
  async getVersionGraph(
    @Param('versionId') versionId: string,
  ): Promise<ApiResponseDto<StoryGraphDto>> {
    const graph = await this.interactiveService.getFullGraph(versionId);
    return new ApiResponseDto(graph);
  }

  @Get('versions/:versionId/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate DAG invariants for a story version' })
  @ApiResponse({ status: 200, description: 'Graph validation result' })
  async validateGraph(
    @Param('versionId') versionId: string,
  ): Promise<ApiResponseDto<GraphValidationResultDto>> {
    const result = await this.interactiveService.validateGraph(versionId);
    return new ApiResponseDto(result);
  }

  @Get('versions/review-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List story versions currently pending review (Admin)' })
  @ApiResponse({ status: 200, description: 'Review queue list' })
  async getReviewQueue(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<StoryVersion[]>> {
    const queue = await this.storyLifecycleService.getReviewQueue(user);
    return new ApiResponseDto(queue);
  }

  @Post('versions/:versionId/submit-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a DRAFT story version for review' })
  @ApiResponse({ status: 200, description: 'Version submitted for review' })
  @ApiResponse({ status: 400, description: 'Graph validation failed or invalid state' })
  async submitForReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('versionId') versionId: string,
  ): Promise<ApiResponseDto<VersionTransitionResponseDto>> {
    const result = await this.storyLifecycleService.submitForReview(user, versionId);
    return new ApiResponseDto(result);
  }

  @Post('versions/:versionId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a story version in review (Admin)' })
  @ApiResponse({ status: 200, description: 'Version approved' })
  @ApiResponse({ status: 400, description: 'Version not in review' })
  async approveVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('versionId') versionId: string,
  ): Promise<ApiResponseDto<VersionTransitionResponseDto>> {
    const result = await this.storyLifecycleService.approveVersion(user, versionId);
    return new ApiResponseDto(result);
  }

  @Post('versions/:versionId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request changes / reject a story version back to draft (Admin)' })
  @ApiResponse({ status: 200, description: 'Version reverted to draft' })
  async rejectVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('versionId') versionId: string,
    @Body() dto?: RejectVersionDto,
  ): Promise<ApiResponseDto<VersionTransitionResponseDto>> {
    const result = await this.storyLifecycleService.rejectVersion(user, versionId, dto);
    return new ApiResponseDto(result);
  }

  @Post('versions/:versionId/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish an approved story version with DAG and video readiness validation' })
  @ApiResponse({ status: 200, description: 'Story version published' })
  @ApiResponse({ status: 400, description: 'Validation failed or version not approved' })
  async publishVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('versionId') versionId: string,
  ): Promise<ApiResponseDto<VersionTransitionResponseDto>> {
    const published = await this.storyLifecycleService.publishVersion(user, versionId);
    return new ApiResponseDto(published);
  }

  @Post('versions/:versionId/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a published story version (read-only)' })
  @ApiResponse({ status: 200, description: 'Story version archived' })
  async archiveVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('versionId') versionId: string,
  ): Promise<ApiResponseDto<VersionTransitionResponseDto>> {
    const result = await this.storyLifecycleService.archiveVersion(user, versionId);
    return new ApiResponseDto(result);
  }

  @Post('versions/:versionId/nodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new node to a story version' })
  @ApiResponse({ status: 201, description: 'Node created' })
  async createNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('versionId') versionId: string,
    @Body() dto: CreateStoryNodeDto,
  ): Promise<ApiResponseDto<StoryNode>> {
    const node = await this.interactiveService.createNode(user, versionId, dto);
    return new ApiResponseDto(node);
  }

  @Patch('nodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a story node' })
  @ApiResponse({ status: 200, description: 'Node updated' })
  async updateNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoryNodeDto,
  ): Promise<ApiResponseDto<StoryNode>> {
    const node = await this.interactiveService.updateNode(user, id, dto);
    return new ApiResponseDto(node);
  }

  @Delete('nodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a story node' })
  @ApiResponse({ status: 200, description: 'Node deleted' })
  async deleteNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ success: boolean; message: string }>> {
    const result = await this.interactiveService.deleteNode(user, id);
    return new ApiResponseDto(result);
  }

  @Post('nodes/:nodeId/choices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a choice dilemma to a node' })
  @ApiResponse({ status: 201, description: 'Choice created' })
  async addChoiceToNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nodeId') nodeId: string,
    @Body() dto: CreateChoiceDto,
  ): Promise<ApiResponseDto<Choice>> {
    const choice = await this.interactiveService.addChoiceToNode(user, nodeId, dto);
    return new ApiResponseDto(choice);
  }

  @Post('choices/:choiceId/options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a choice option leading to a destination node' })
  @ApiResponse({ status: 201, description: 'Choice option created' })
  async addChoiceOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('choiceId') choiceId: string,
    @Body() dto: CreateChoiceOptionDto,
  ): Promise<ApiResponseDto<ChoiceOption>> {
    const option = await this.interactiveService.addChoiceOption(user, choiceId, dto);
    return new ApiResponseDto(option);
  }

  @Post('choices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit and resolve an interactive viewer choice (ACID transaction)' })
  @ApiResponse({ status: 200, description: 'Choice resolved with next destination node and awarded XP' })
  @ApiResponse({ status: 400, description: 'Invalid destination node or archived version' })
  @ApiResponse({ status: 403, description: 'Story version not published' })
  @ApiResponse({ status: 404, description: 'Choice or choice option not found' })
  @ApiResponse({ status: 409, description: 'Voting window closed' })
  async submitChoice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitChoiceDto,
  ): Promise<ApiResponseDto<ChoiceResolutionResponseDto>> {
    const result = await this.choiceEngineService.resolveChoice(user, dto);
    return new ApiResponseDto(result);
  }

  @Post('choices/:choiceId/fallback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-resolve fallback choice when voting window has closed' })
  @ApiResponse({ status: 200, description: 'Fallback choice resolved' })
  async resolveFallback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('choiceId') choiceId: string,
    @Query('storyVersionId') storyVersionId: string,
  ): Promise<ApiResponseDto<ChoiceResolutionResponseDto>> {
    const result = await this.choiceEngineService.resolveFallback(user, choiceId, storyVersionId);
    return new ApiResponseDto(result);
  }

  @Get('users/me/choices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user choices for a story version' })
  @ApiResponse({ status: 200, description: 'List of user choices' })
  async getMyChoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('storyVersionId') storyVersionId: string,
  ): Promise<ApiResponseDto<UserChoice[]>> {
    const choices = await this.choiceEngineService.getUserChoicesForVersion(
      user.id,
      storyVersionId,
    );
    return new ApiResponseDto(choices);
  }
}

