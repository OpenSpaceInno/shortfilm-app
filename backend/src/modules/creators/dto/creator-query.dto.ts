import { IsOptional, IsString, IsIn, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatorTier, CreatorStatus } from '../../../database/schema';

export class CreatorQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tier: EMERGING, VERIFIED, EXCLUSIVE, PARTNER' })
  @IsOptional()
  @IsIn(['EMERGING', 'VERIFIED', 'EXCLUSIVE', 'PARTNER'])
  tier?: CreatorTier;

  @ApiPropertyOptional({ description: 'Filter by lifecycle status' })
  @IsOptional()
  @IsIn([
    'APPLIED',
    'UNDER_REVIEW',
    'APPROVED',
    'VERIFIED',
    'ACTIVE',
    'SUSPENDED',
    'REJECTED',
    'DEACTIVATED',
  ])
  status?: CreatorStatus;

  @ApiPropertyOptional({ description: 'Filter by category (e.g. Drama, Mystery, Thriller)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter only featured creators' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Search term for creator display name or bio' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of creators per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Pagination offset', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
