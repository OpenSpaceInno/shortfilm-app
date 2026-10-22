import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateEpisodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsInt()
  @Min(1)
  episodeNumber: number;

  @IsString()
  @IsOptional()
  synopsis?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean = false;
}

export interface EpisodeResponseDto {
  id: string;
  seasonId: string;
  title: string;
  episodeNumber: number;
  synopsis?: string | null;
  thumbnailUrl?: string | null;
  isFree: boolean;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
