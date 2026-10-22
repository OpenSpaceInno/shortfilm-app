import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsObject, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Filmmaker and interactive story enthusiast.', description: 'User biography' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'en', description: 'ISO 639-1 language code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  languagePreference?: string;

  @ApiPropertyOptional({ example: ['thriller', 'mystery'], description: 'Preferred story genres' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genrePreferences?: string[];

  @ApiPropertyOptional({ example: { newEpisodes: true, marketing: false }, description: 'Notification settings' })
  @IsOptional()
  @IsObject()
  notificationPreferences?: Record<string, boolean>;
}
