import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookAcknowledgmentDto {
  @ApiProperty({ description: 'Indicates receipt acknowledgment to provider', example: true })
  received: boolean;

  @ApiPropertyOptional({ description: 'External event unique ID', example: 'evt_rzp_123456789' })
  eventId?: string;

  @ApiProperty({
    description: 'Outcome status of the webhook event handling',
    enum: ['PROCESSED', 'ALREADY_PROCESSED', 'IGNORED', 'FAILED'],
    example: 'PROCESSED',
  })
  status: 'PROCESSED' | 'ALREADY_PROCESSED' | 'IGNORED' | 'FAILED';

  @ApiPropertyOptional({ description: 'Additional context or error message' })
  message?: string;
}
