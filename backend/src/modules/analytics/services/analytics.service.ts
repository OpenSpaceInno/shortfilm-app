import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { generateUlid } from '../../../database/utils/ulid.util';
import {
  REDIS_STREAM_KEY,
} from '../constants/analytics.constants';
import {
  AnalyticsEventDto,
  AnalyticsIngestResponseDto,
} from '../dto';
import { RedisStreamService } from './redis-stream.service';

export interface NormalizedAnalyticsEvent extends AnalyticsEventDto {
  eventId: string;
  occurredAt: string;
  clientIp?: string;
  userAgent?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly redisStreamService: RedisStreamService) {}

  /**
   * Anonymizes IP addresses per Decision LC-003 & P2-ANL-002:
   * Hashes client IP with a daily UTC salt using SHA-256 and truncates to 16 characters.
   * Prevents raw IP persistence in analytics pipelines while preserving daily uniqueness.
   */
  anonymizeIp(rawIp?: string): string | undefined {
    if (!rawIp) return undefined;
    const cleanIp = rawIp.split(',')[0].trim();
    if (!cleanIp || cleanIp === '::1' || cleanIp === '127.0.0.1') {
      return '127.0.0.1-local';
    }
    const dailySalt = new Date().toISOString().slice(0, 10);
    return crypto
      .createHash('sha256')
      .update(`${cleanIp}:${dailySalt}`)
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Normalizes an incoming event with generated identifiers, timestamps, and anonymized telemetry.
   */
  normalizeEvent(
    dto: AnalyticsEventDto,
    rawIp?: string,
    userAgent?: string,
    authenticatedUserId?: string,
  ): NormalizedAnalyticsEvent {
    const eventId = dto.eventId?.trim() || generateUlid();
    const occurredAt = dto.occurredAt || new Date().toISOString();
    const userId = dto.userId || authenticatedUserId || undefined;
    const clientIp = this.anonymizeIp(rawIp);

    return {
      ...dto,
      eventId,
      userId,
      occurredAt,
      clientIp,
      userAgent: userAgent ? userAgent.slice(0, 255) : undefined,
    };
  }

  /**
   * Converts a normalized event into Redis Stream field-value pairs for XADD.
   */
  toStreamFields(event: NormalizedAnalyticsEvent): Record<string, string> {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      sessionId: event.sessionId,
      userId: event.userId || '',
      storyId: event.storyId || '',
      episodeId: event.episodeId || '',
      nodeId: event.nodeId || '',
      choiceId: event.choiceId || '',
      occurredAt: event.occurredAt,
      platform: event.platform || 'WEB',
      clientIp: event.clientIp || '',
      userAgent: event.userAgent || '',
      payload: JSON.stringify(event),
    };
  }

  /**
   * Ingests a single analytics telemetry event.
   */
  async ingestEvent(
    dto: AnalyticsEventDto,
    rawIp?: string,
    userAgent?: string,
    authenticatedUserId?: string,
  ): Promise<AnalyticsIngestResponseDto> {
    const normalized = this.normalizeEvent(dto, rawIp, userAgent, authenticatedUserId);
    const fields = this.toStreamFields(normalized);

    await this.redisStreamService.addToStream(REDIS_STREAM_KEY, fields);

    return {
      accepted: true,
      count: 1,
      ingestedAt: new Date().toISOString(),
    };
  }

  /**
   * Ingests a batch of analytics telemetry events with pipelined stream append.
   */
  async ingestBatch(
    events: AnalyticsEventDto[],
    rawIp?: string,
    userAgent?: string,
    authenticatedUserId?: string,
  ): Promise<AnalyticsIngestResponseDto> {
    if (!events || events.length === 0) {
      return {
        accepted: true,
        count: 0,
        ingestedAt: new Date().toISOString(),
      };
    }

    const batchFields: Array<Record<string, string>> = [];
    for (const dto of events) {
      const normalized = this.normalizeEvent(dto, rawIp, userAgent, authenticatedUserId);
      batchFields.push(this.toStreamFields(normalized));
    }

    await this.redisStreamService.addBatchToStream(REDIS_STREAM_KEY, batchFields);

    return {
      accepted: true,
      count: batchFields.length,
      ingestedAt: new Date().toISOString(),
    };
  }
}
