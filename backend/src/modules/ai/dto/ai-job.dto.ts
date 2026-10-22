import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiJobStatusResponseDto {
  @ApiProperty({ example: '01HA0123456789ABCDEF000001' })
  jobId: string;

  @ApiProperty({ example: 'PRODUCTION_PACK' })
  jobType: string;

  @ApiProperty({
    example: 'COMPLETE',
    enum: ['QUEUED', 'PROCESSING', 'COMPLETE', 'FAILED'],
  })
  status: string;

  @ApiProperty({ example: 100 })
  progressPercent: number;

  @ApiPropertyOptional({ description: 'Generated creative payload when status is COMPLETE' })
  resultData?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Error message if status is FAILED' })
  errorMessage?: string | null;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}
