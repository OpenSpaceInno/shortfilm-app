import { ApiProperty } from '@nestjs/swagger';

export class CancellationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'Timestamp when cancellation was recorded' })
  cancelledAt: Date;

  @ApiProperty({ description: 'End of current paid period up to which user retains VIP access' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Human friendly confirmation message' })
  message: string;
}
