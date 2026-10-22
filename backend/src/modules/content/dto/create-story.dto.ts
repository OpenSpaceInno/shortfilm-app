import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  synopsis: string;

  @IsString()
  @IsOptional()
  premise?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string = 'en';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  posterUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contentRating?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  targetAudience?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  genreIds?: string[];
}
