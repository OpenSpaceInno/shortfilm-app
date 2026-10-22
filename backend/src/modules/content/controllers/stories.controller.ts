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
import { StoriesService } from '../services/stories.service';
import { CreateStoryDto } from '../dto/create-story.dto';
import { UpdateStoryDto } from '../dto/update-story.dto';
import { StoryQueryDto } from '../dto/story-query.dto';
import { StoryResponseDto } from '../dto/story-response.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ResourceOwnershipGuard } from '../../auth/guards/resource-ownership.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CheckOwnership } from '../../auth/decorators/check-ownership.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse and filter stories feed' })
  @ApiResponse({ status: 200, description: 'Paginated list of stories' })
  async getFeed(@Query() query: StoryQueryDto): Promise<ApiResponseDto<StoryResponseDto[]>> {
    const { items, total, page, limit } = await this.storiesService.getFeed(query);
    return new ApiResponseDto(items, { total, page, limit });
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured stories' })
  @ApiResponse({ status: 200, description: 'Featured stories list' })
  async getFeatured(): Promise<ApiResponseDto<StoryResponseDto[]>> {
    const stories = await this.storiesService.getFeatured();
    return new ApiResponseDto(stories);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get story details by ID' })
  @ApiResponse({ status: 200, description: 'Story detail' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async getStoryById(@Param('id') id: string): Promise<ApiResponseDto<StoryResponseDto>> {
    const story = await this.storiesService.getStoryById(id);
    return new ApiResponseDto(story);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new story draft' })
  @ApiResponse({ status: 201, description: 'Story draft created' })
  async createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoryDto,
  ): Promise<ApiResponseDto<StoryResponseDto>> {
    const story = await this.storiesService.createDraft(user, dto);
    return new ApiResponseDto(story);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @CheckOwnership({ resourceType: 'story', paramName: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update story metadata (Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Story metadata updated' })
  async updateStory(
    @Param('id') id: string,
    @Body() dto: UpdateStoryDto,
  ): Promise<ApiResponseDto<StoryResponseDto>> {
    const story = await this.storiesService.updateStory(id, dto);
    return new ApiResponseDto(story);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @CheckOwnership({ resourceType: 'story', paramName: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a story (Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Story deleted' })
  async deleteStory(@Param('id') id: string): Promise<ApiResponseDto<{ success: boolean; message: string }>> {
    const result = await this.storiesService.deleteStory(id);
    return new ApiResponseDto(result);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @CheckOwnership({ resourceType: 'story', paramName: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a story version (Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Story published' })
  @ApiResponse({ status: 400, description: 'Missing season or episode invariant' })
  async publishStory(@Param('id') id: string): Promise<ApiResponseDto<StoryResponseDto>> {
    const story = await this.storiesService.publishStory(id);
    return new ApiResponseDto(story);
  }
}
