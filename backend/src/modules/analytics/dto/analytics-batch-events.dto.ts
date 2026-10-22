import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AnalyticsEventDto } from './analytics-event.dto';
import { MAX_BATCH_EVENTS_LIMIT } from '../constants/analytics.constants';

export class AnalyticsBatchEventsDto {
  @ApiProperty({
    description: `Batch list of analytics telemetry events (1 to ${MAX_BATCH_EVENTS_LIMIT})`,
    type: [AnalyticsEventDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_EVENTS_LIMIT)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events: AnalyticsEventDto[];
}
