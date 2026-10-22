import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsIngestResponseDto {
  @ApiProperty({
    description: 'Whether telemetry event(s) were accepted and queued into the stream buffer',
    example: true,
  })
  accepted: boolean;

  @ApiProperty({
    description: 'Number of events accepted and buffered',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: 'UTC ISO-8601 ingestion timestamp',
    example: '2026-10-10T18:00:00.000Z',
  })
  ingestedAt: string;
}
