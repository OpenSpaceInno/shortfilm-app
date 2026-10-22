import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConceptExpandRequestDto {
  @ApiProperty({
    description: 'Story idea / premise seed',
    example: 'A young woman begins receiving voice notes from her future self warning her about decisions she has not yet made.',
  })
  @IsString()
  @IsNotEmpty()
  idea: string;

  @ApiPropertyOptional({ description: 'Primary genre', example: 'Mystery · Romance' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Language of dialogue and culture', example: 'Hindi' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Target number of episodes', example: 8 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(20)
  episodesTarget?: number;

  @ApiPropertyOptional({ description: 'Format', example: 'Vertical Short Series (9:16 portrait)' })
  @IsOptional()
  @IsString()
  format?: string;
}

export class StoryArcStepDto {
  @ApiProperty({ example: 'Act I — The First Message' })
  label: string;

  @ApiProperty({ example: 'Maya dismisses the audio note until its prediction prevents an accident.' })
  text: string;
}

export class CharacterBriefDto {
  @ApiProperty({ example: 'Maya' })
  name: string;

  @ApiProperty({ example: 'Age 24' })
  age: string;

  @ApiProperty({ example: 'Protagonist' })
  role: string;

  @ApiProperty({ example: 'Night-shift systems architect, skeptic.' })
  note: string;
}

export class ConceptExpandResponseDto {
  @ApiProperty({ example: 'Messages From Tomorrow' })
  title: string;

  @ApiProperty({ example: 'Mystery · Romance' })
  genre: string;

  @ApiProperty({ example: 'Hindi' })
  language: string;

  @ApiProperty({ example: 'Vertical Short Series (9:16 portrait)' })
  format: string;

  @ApiProperty({ example: 8 })
  episodes: number;

  @ApiProperty({
    example: 'A young woman begins receiving voice notes from her future self warning her about decisions she has not yet made.',
  })
  logline: string;

  @ApiProperty({ example: 'Young adults 18-30 seeking high-tension romantic thrillers' })
  targetAudience: string;

  @ApiProperty({ type: [StoryArcStepDto] })
  arc: StoryArcStepDto[];

  @ApiProperty({ type: [CharacterBriefDto] })
  characters: CharacterBriefDto[];
}
