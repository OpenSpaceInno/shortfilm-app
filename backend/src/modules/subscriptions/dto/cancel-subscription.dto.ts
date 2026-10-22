import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: 'Optional reason for cancellation', example: 'Cost / Completed current series' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Optional user feedback notes' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
