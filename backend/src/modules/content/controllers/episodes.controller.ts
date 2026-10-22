import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EpisodesService } from '../services/episodes.service';
import { CreateEpisodeDto, EpisodeResponseDto } from '../dto/create-episode.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ResourceOwnershipGuard } from '../../auth/guards/resource-ownership.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CheckOwnership } from '../../auth/decorators/check-ownership.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('episodes')
@Controller()
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Public()
  @Get('stories/:storyId/seasons/:seasonId/episodes')
  @ApiOperation({ summary: 'List all episodes in a season' })
  @ApiResponse({ status: 200, description: 'List of episodes' })
  async getEpisodesBySeason(
    @Param('seasonId') seasonId: string,
  ): Promise<ApiResponseDto<EpisodeResponseDto[]>> {
    const episodes = await this.episodesService.getEpisodesBySeason(seasonId);
    return new ApiResponseDto(episodes);
  }

  @Public()
  @Get('episodes/:id')
  @ApiOperation({ summary: 'Get episode details by ID' })
  @ApiResponse({ status: 200, description: 'Episode details' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async getEpisodeById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<EpisodeResponseDto>> {
    const episode = await this.episodesService.getEpisodeById(id);
    return new ApiResponseDto(episode);
  }

  @Post('stories/:storyId/seasons/:seasonId/episodes')
  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @CheckOwnership({ resourceType: 'story', paramName: 'storyId' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an episode for a season (Owner or Admin)' })
  @ApiResponse({ status: 201, description: 'Episode created' })
  async createEpisode(
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateEpisodeDto,
  ): Promise<ApiResponseDto<EpisodeResponseDto>> {
    const episode = await this.episodesService.createEpisode(seasonId, dto);
    return new ApiResponseDto(episode);
  }
}
