import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeasonsService } from '../services/seasons.service';
import { CreateSeasonDto, SeasonResponseDto } from '../dto/create-season.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ResourceOwnershipGuard } from '../../auth/guards/resource-ownership.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CheckOwnership } from '../../auth/decorators/check-ownership.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('seasons')
@Controller('stories/:storyId/seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all seasons for a story' })
  @ApiResponse({ status: 200, description: 'List of seasons' })
  async getSeasons(
    @Param('storyId') storyId: string,
  ): Promise<ApiResponseDto<SeasonResponseDto[]>> {
    const seasons = await this.seasonsService.getSeasonsByStoryId(storyId);
    return new ApiResponseDto(seasons);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @CheckOwnership({ resourceType: 'story', paramName: 'storyId' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new season for a story (Owner or Admin)' })
  @ApiResponse({ status: 201, description: 'Season created' })
  async createSeason(
    @Param('storyId') storyId: string,
    @Body() dto: CreateSeasonDto,
  ): Promise<ApiResponseDto<SeasonResponseDto>> {
    const season = await this.seasonsService.createSeason(storyId, dto);
    return new ApiResponseDto(season);
  }
}
