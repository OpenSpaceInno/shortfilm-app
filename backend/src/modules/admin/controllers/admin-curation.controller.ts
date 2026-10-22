import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContentCurationService } from '../services/content-curation.service';
import {
  QueryAdminStoriesDto,
  AdminStoryResponseDto,
  CurateStoryDto,
  AdminArchiveStoryDto,
  AdminUnpublishStoryDto,
  AdminOverrideMetadataDto,
  CreateCurationDto,
  UpdateCurationDto,
  FeaturedCurationResponseDto,
} from '../dto/content-curation.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { Request } from 'express';

@ApiTags('Admin - Content Curation')
@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminCurationController {
  constructor(private readonly curationService: ContentCurationService) {}

  @Get('stories')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'ANALYST')
  @ApiOperation({ summary: 'Admin list all catalog stories with filters and creator attribution' })
  @ApiResponse({ status: 200, type: [AdminStoryResponseDto] })
  async getStories(@Query() query: QueryAdminStoriesDto) {
    const result = await this.curationService.getStories(query);
    return new ApiResponseDto(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get('stories/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'ANALYST')
  @ApiOperation({ summary: 'Admin get story detail, seasons, and curation status' })
  async getStoryDetail(@Param('id') id: string) {
    const story = await this.curationService.getStoryDetail(id);
    return new ApiResponseDto(story);
  }

  @Patch('stories/:id/curation')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Curate story: toggle featured flag, carousel collection, badge, rank' })
  async curateStory(
    @Param('id') id: string,
    @Body() dto: CurateStoryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const updated = await this.curationService.curateStory(id, dto, user, reqInfo);
    return new ApiResponseDto(updated);
  }

  @Post('stories/:id/archive')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Archive story from catalog with audit rationale' })
  async archiveStory(
    @Param('id') id: string,
    @Body() dto: AdminArchiveStoryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.curationService.archiveStory(id, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Post('stories/:id/unpublish')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Emergency unpublish / delist story and revert to DRAFT' })
  async unpublishStory(
    @Param('id') id: string,
    @Body() dto: AdminUnpublishStoryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.curationService.unpublishStory(id, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Patch('stories/:id/metadata')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Override story editorial metadata (title, description, ageRating)' })
  async overrideMetadata(
    @Param('id') id: string,
    @Body() dto: AdminOverrideMetadataDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const updated = await this.curationService.overrideMetadata(id, dto, user, reqInfo);
    return new ApiResponseDto(updated);
  }

  @Get('curations')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'List curated featured collections and spotlight carousels' })
  @ApiResponse({ status: 200, type: [FeaturedCurationResponseDto] })
  async listCurations(@Query('collectionType') collectionType?: any) {
    const list = await this.curationService.listCurations(collectionType);
    return new ApiResponseDto(list);
  }

  @Post('curations')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Add a story to a featured curated carousel' })
  @ApiResponse({ status: 201, type: FeaturedCurationResponseDto })
  async createCuration(
    @Body() dto: CreateCurationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.curationService.createCuration(dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Patch('curations/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Update featured curation positioning, badge, or active status' })
  async updateCuration(
    @Param('id') id: string,
    @Body() dto: UpdateCurationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.curationService.updateCuration(id, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Delete('curations/:id')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Remove a story from a featured curated collection' })
  async deleteCuration(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.curationService.deleteCuration(id, user, reqInfo);
    return new ApiResponseDto(result);
  }
}
