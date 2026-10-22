import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import {
  AnalyticsBatchEventsDto,
  AnalyticsEventDto,
  AnalyticsIngestResponseDto,
} from '../dto';
import { AnalyticsService } from '../services/analytics.service';
import { ThrottleTier, RateLimitTier } from '../../security';

@ApiTags('Analytics')
@Controller('analytics')
@ThrottleTier(RateLimitTier.ANALYTICS)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest analytics telemetry event or batch (202 Accepted)',
    description:
      'High-throughput asynchronous ingestion endpoint. Accepts either a single event or a batch of events (up to 100). Buffers telemetry into Redis Streams without synchronous relational DB overhead.',
  })
  @ApiAcceptedResponse({
    description: 'Telemetry event(s) accepted and queued for processing',
    type: AnalyticsIngestResponseDto,
  })
  async ingestEvents(
    @Body() body: any,
    @Req() req: Request,
  ): Promise<AnalyticsIngestResponseDto> {
    const rawIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket?.remoteAddress ||
      (req as any).ip;
    const userAgent = req.headers['user-agent'];
    const authHeader = req.headers['authorization'];
    // Optional authenticated user id if present in JWT token decoded by interceptors/guards
    const authenticatedUserId = (req as any).user?.id;

    // Check if body is an explicit batch payload with { events: [...] }
    if (body && Array.isArray(body.events)) {
      return this.analyticsService.ingestBatch(
        body.events,
        rawIp,
        userAgent,
        authenticatedUserId,
      );
    }

    // Check if body is a top-level array of events
    if (Array.isArray(body)) {
      return this.analyticsService.ingestBatch(
        body,
        rawIp,
        userAgent,
        authenticatedUserId,
      );
    }

    // Single event
    return this.analyticsService.ingestEvent(
      body as AnalyticsEventDto,
      rawIp,
      userAgent,
      authenticatedUserId,
    );
  }

  @Public()
  @Post('events/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest batch of analytics telemetry events (202 Accepted)',
    description:
      'High-throughput client batch ingestion endpoint. Ingests up to 100 telemetry events via pipelined Redis Stream appends.',
  })
  @ApiAcceptedResponse({
    description: 'Batch accepted and queued into stream buffer',
    type: AnalyticsIngestResponseDto,
  })
  async ingestBatch(
    @Body() dto: AnalyticsBatchEventsDto,
    @Req() req: Request,
  ): Promise<AnalyticsIngestResponseDto> {
    const rawIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket?.remoteAddress ||
      (req as any).ip;
    const userAgent = req.headers['user-agent'];
    const authenticatedUserId = (req as any).user?.id;

    return this.analyticsService.ingestBatch(
      dto.events,
      rawIp,
      userAgent,
      authenticatedUserId,
    );
  }
}
