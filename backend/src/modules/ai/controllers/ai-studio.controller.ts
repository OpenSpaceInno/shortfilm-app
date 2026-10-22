import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { AiStudioService } from '../services/ai-studio.service';
import {
  ConceptExpandRequestDto,
  ConceptExpandResponseDto,
  CharacterForgeRequestDto,
  CharacterForgeResponseDto,
  BranchDilemmaRequestDto,
  BranchDilemmaResponseDto,
  CliffhangerRequestDto,
  CliffhangerResponseDto,
  ProductionPackRequestDto,
  ProductionPackJobCreatedDto,
  AiJobStatusResponseDto,
  AiUsageSummaryDto,
} from '../dto';

import { ThrottleTier, RateLimitTier } from '../../security';

@ApiTags('ai-studio')
@Controller('ai-studio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ThrottleTier(RateLimitTier.AI)
export class AiStudioController {
  constructor(private readonly aiStudioService: AiStudioService) {}

  @Post('concept-expand')
  @ApiOperation({
    summary: 'Expand raw story premise into structured 8-episode narrative arc & characters',
  })
  @ApiResponse({ status: 200, type: ConceptExpandResponseDto })
  async expandConcept(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConceptExpandRequestDto,
  ): Promise<ApiResponseDto<ConceptExpandResponseDto>> {
    const result = await this.aiStudioService.expandConcept(dto, user.id);
    return new ApiResponseDto(result);
  }

  @Post('character-forge')
  @ApiOperation({
    summary: 'Forge dimensional characters with distinct motivations, flaws, and voice cues',
  })
  @ApiResponse({ status: 200, type: CharacterForgeResponseDto })
  async forgeCharacters(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CharacterForgeRequestDto,
  ): Promise<ApiResponseDto<CharacterForgeResponseDto>> {
    const result = await this.aiStudioService.forgeCharacters(dto, user.id);
    return new ApiResponseDto(result);
  }

  @Post('branch-dilemma')
  @ApiOperation({
    summary: 'Generate high-tension interactive bifurcations and moral decision forks',
  })
  @ApiResponse({ status: 200, type: BranchDilemmaResponseDto })
  async generateDilemma(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BranchDilemmaRequestDto,
  ): Promise<ApiResponseDto<BranchDilemmaResponseDto>> {
    const result = await this.aiStudioService.generateDilemma(dto, user.id);
    return new ApiResponseDto(result);
  }

  @Post('cliffhanger')
  @ApiOperation({
    summary: 'Craft irresistible ending retention cliffhangers with visual & audio cues',
  })
  @ApiResponse({ status: 200, type: CliffhangerResponseDto })
  async craftCliffhanger(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CliffhangerRequestDto,
  ): Promise<ApiResponseDto<CliffhangerResponseDto>> {
    const result = await this.aiStudioService.craftCliffhanger(dto, user.id);
    return new ApiResponseDto(result);
  }

  @Post('production-pack')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue asynchronous generation of full multi-part series production pack bible',
  })
  @ApiResponse({ status: 202, type: ProductionPackJobCreatedDto })
  async queueProductionPack(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProductionPackRequestDto,
  ): Promise<ApiResponseDto<ProductionPackJobCreatedDto>> {
    const result = await this.aiStudioService.queueProductionPack(dto, user.id);
    return new ApiResponseDto(result);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Poll status and retrieve result of an asynchronous AI job' })
  @ApiResponse({ status: 200, type: AiJobStatusResponseDto })
  async getJobStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<ApiResponseDto<AiJobStatusResponseDto>> {
    const result = await this.aiStudioService.getJobStatus(jobId, user.id);
    return new ApiResponseDto(result);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Audit AI token usage, costs, and feature breakdowns for the caller' })
  @ApiResponse({ status: 200, type: AiUsageSummaryDto })
  async getUsage(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<AiUsageSummaryDto>> {
    const result = await this.aiStudioService.getUserUsage(user.id);
    return new ApiResponseDto(result);
  }
}
