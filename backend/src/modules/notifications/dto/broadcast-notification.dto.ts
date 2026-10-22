import { IsString, IsNotEmpty, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BroadcastNotificationDto {
  @ApiProperty({ description: 'Broadcast message title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Broadcast message body content' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Category type (default: SYSTEM_BROADCAST)' })
  @IsOptional()
  @IsString()
  type?: string = 'SYSTEM_BROADCAST';

  @ApiPropertyOptional({ description: 'Target channels: IN_APP, PUSH, EMAIL, ALL', enum: ['IN_APP', 'PUSH', 'EMAIL', 'ALL'] })
  @IsOptional()
  @IsIn(['IN_APP', 'PUSH', 'EMAIL', 'ALL'])
  channel?: 'IN_APP' | 'PUSH' | 'EMAIL' | 'ALL' = 'IN_APP';

  @ApiPropertyOptional({ description: 'Additional structured payload data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
