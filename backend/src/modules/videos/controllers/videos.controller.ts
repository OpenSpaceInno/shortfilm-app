import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { VideosService } from '../services/videos.service';
import { CreateDirectUploadDto, DirectUploadResponseDto } from '../dto/direct-upload.dto';
import { PlaybackStreamResponseDto } from '../dto/playback-stream.dto';
import { CloudflareWebhookPayload } from '../dto/cloudflare-webhook.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('videos')
@Controller()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('videos/direct-upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtain a direct TUS upload URL for Cloudflare Stream' })
  @ApiResponse({ status: 201, description: 'Direct upload URL generated' })
  @ApiResponse({ status: 403, description: 'User does not own the story' })
  async getDirectUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDirectUploadDto,
  ): Promise<ApiResponseDto<DirectUploadResponseDto>> {
    const result = await this.videosService.getDirectUploadUrl(user, dto);
    return new ApiResponseDto(result);
  }

  @Public()
  @Get('episodes/:id/stream')
  @ApiOperation({ summary: 'Get signed HLS playback URL for an episode' })
  @ApiResponse({ status: 200, description: 'Signed playback token and manifest URL' })
  @ApiResponse({ status: 401, description: 'Subscription or authentication required' })
  @ApiResponse({ status: 400, description: 'Video not ready or transcoding' })
  async getPlaybackStream(
    @Param('id') episodeId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ApiResponseDto<PlaybackStreamResponseDto>> {
    const result = await this.videosService.getPlaybackStream(user, episodeId);
    return new ApiResponseDto(result);
  }

  @Public()
  @Post('videos/webhooks/cloudflare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cloudflare Stream transcoding and ready state webhook' })
  @ApiResponse({ status: 200, description: 'Webhook acknowledged' })
  async handleCloudflareWebhook(
    @Headers('webhook-signature') signature: string,
    @Headers('cf-webhook-signature') cfSignature: string,
    @Req() req: Request,
    @Body() payload: CloudflareWebhookPayload,
  ): Promise<{ received: boolean; status: string }> {
    const rawBody = (req as any).rawBody || JSON.stringify(payload);
    const activeSig = signature || cfSignature || '';
    return this.videosService.handleCloudflareWebhook(activeSig, rawBody, payload);
  }

  @Get('videos/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video processing status' })
  @ApiResponse({ status: 200, description: 'Video metadata and status' })
  async getVideoStatus(@Param('id') id: string) {
    const video = await this.videosService.getVideoStatus(id);
    return new ApiResponseDto(video);
  }
}
