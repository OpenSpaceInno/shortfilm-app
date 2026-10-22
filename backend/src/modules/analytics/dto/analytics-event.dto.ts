import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AnalyticsEventType } from '../constants/analytics.constants';

export class AnalyticsEventDto {
  @ApiPropertyOptional({
    description: 'Unique client or server ULID event identifier. Generated automatically if omitted.',
    example: '01HTXYZ123456789ABCDEFGHJK',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  eventId?: string;

  @ApiProperty({
    description: 'Canonical event type',
    enum: AnalyticsEventType,
    example: AnalyticsEventType.VIDEO_STARTED,
  })
  @IsNotEmpty()
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @ApiPropertyOptional({
    description: 'Authenticated or pseudonymous user ID',
    example: '01HTUSER123456789ABCDEFGHJ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  userId?: string;

  @ApiProperty({
    description: 'Client session UUID/ULID token for correlating binging sessions',
    example: 'sess-9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Story ULID if applicable',
    example: '01HTSTORY123456789ABCDEFGH',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  storyId?: string;

  @ApiPropertyOptional({
    description: 'Episode ULID if applicable',
    example: '01HTEP123456789ABCDEFGHJKL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  episodeId?: string;

  @ApiPropertyOptional({
    description: 'Story branch node ULID if applicable',
    example: '01HTNODE123456789ABCDEFGHJ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  nodeId?: string;

  @ApiPropertyOptional({
    description: 'Interactive choice option ID if applicable',
    example: '01HTCHOICE123456789ABCDEFG',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  choiceId?: string;

  @ApiPropertyOptional({
    description: 'Client timestamp in UTC ISO-8601. Defaults to server ingestion timestamp if omitted.',
    example: '2026-10-10T18:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional({
    description: 'Client platform/device type (e.g. WEB, PWA_ANDROID, IOS)',
    example: 'WEB',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  platform?: string;

  @ApiPropertyOptional({
    description: 'App version string',
    example: '1.4.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'Telemetry metrics payload (e.g. playbackTimeSec, totalDurationSec, bitrateKbps)',
    example: { playbackTimeSec: 15.4, totalDurationSec: 90.0, bitrateKbps: 2400 },
  })
  @IsOptional()
  @IsObject()
  metrics?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Custom metadata payload (e.g. referrer, networkType)',
    example: { referrer: 'home_feed', networkType: '5g' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
