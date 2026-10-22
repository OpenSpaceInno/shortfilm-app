import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoryArcStepDto } from './concept-expand.dto';

export class ProductionPackRequestDto {
  @ApiProperty({
    description: 'High concept premise seed or full series logline',
    example: 'In a vertical Mumbai sky-corridor, an ethical memory hacker is hired to delete a crime she has not yet committed.',
  })
  @IsString()
  @IsNotEmpty()
  conceptSeed: string;

  @ApiPropertyOptional({ description: 'Primary genre', example: 'Cyberpunk · Thriller' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Language of dialogue', example: 'Hinglish' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Desired episode count', example: 8, default: 8 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(16)
  episodesTarget?: number;

  @ApiPropertyOptional({ description: 'Creator style notes or constraints' })
  @IsOptional()
  @IsString()
  creatorNotes?: string;
}

export class ProductionPackJobCreatedDto {
  @ApiProperty({ example: '01HA0123456789ABCDEF000001' })
  jobId: string;

  @ApiProperty({ example: 'QUEUED' })
  status: string;

  @ApiProperty({ example: 10 })
  estimatedWaitSeconds: number;

  @ApiProperty({ example: 'Production pack generation job queued successfully' })
  message: string;
}

export class EpisodePlanDto {
  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ example: 'The Uncommitted Crime' })
  title: string;

  @ApiProperty({ example: 'Zara receives an escrow payment for a hit that hasn’t happened.' })
  synopsis: string;

  @ApiProperty({ example: 'A retinal scan reveals Zara’s own biometric signature at tomorrow’s crime scene.' })
  hook: string;

  @ApiProperty({ example: 'The target walks through Zara’s front door asking for sanctuary.' })
  cliffhanger: string;

  @ApiProperty({ example: '2m 10s' })
  duration: string;

  @ApiProperty({ example: true })
  isChoicePoint: boolean;
}

export class ProductionChoiceDto {
  @ApiProperty({ example: 1 })
  episode: number;

  @ApiProperty({ example: 'Should Zara let Veer inside her apartment or lock the blast doors?' })
  prompt: string;

  @ApiProperty({ example: 'Open blast doors and let him in' })
  optionA: string;

  @ApiProperty({ example: 'Lock doors and trigger perimeter silent alarm' })
  optionB: string;

  @ApiProperty({ example: 'Veer reveals the syndicate dossier, but compromises Zara’s secret hideout.' })
  consequenceA: string;

  @ApiProperty({ example: 'Zara remains hidden, but Veer is apprehended by corporate enforcers.' })
  consequenceB: string;
}

export class ProductionNoteDto {
  @ApiProperty({ example: 'Cinematography & Framing Guide' })
  title: string;

  @ApiProperty({ example: 'All scenes framed vertically at 9:16 (1080x1920)...' })
  body: string;
}

export class ProductionPackResponseDto {
  @ApiProperty({ example: 'Neon Karma 2099' })
  title: string;

  @ApiProperty({ example: 'Cyberpunk · Thriller' })
  genre: string;

  @ApiProperty({ example: 'Hinglish' })
  language: string;

  @ApiProperty({ example: 8 })
  episodesCount: number;

  @ApiProperty({ example: 'In a vertical Mumbai sky-corridor, an ethical memory hacker...' })
  logline: string;

  @ApiProperty({ type: [StoryArcStepDto] })
  arc: StoryArcStepDto[];

  @ApiProperty()
  characters: any[];

  @ApiProperty({ type: [EpisodePlanDto] })
  episodeList: EpisodePlanDto[];

  @ApiProperty({ type: [ProductionChoiceDto] })
  choices: ProductionChoiceDto[];

  @ApiProperty({ type: [ProductionNoteDto] })
  productionPack: ProductionNoteDto[];
}
