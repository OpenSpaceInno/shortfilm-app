import { IsOptional, IsString, IsArray, IsObject, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCreatorProfileDto {
  @ApiPropertyOptional({ description: 'Display name / studio brand name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Short catchphrase tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Detailed creative biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Avatar thumbnail image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Cover background banner image URL' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Operating base location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Primary creative focus category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Genre specialties', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ description: 'Production languages', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Creative background & past credits' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ description: 'External portfolio website' })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiPropertyOptional({ description: 'Official creator website' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Social media profile handles & links' })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}
