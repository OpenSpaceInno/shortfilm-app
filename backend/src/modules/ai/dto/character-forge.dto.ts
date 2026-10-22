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

export class CharacterForgeRequestDto {
  @ApiProperty({
    description: 'Story logline or world premise context',
    example: 'In a vertical Mumbai sky-corridor, an ethical memory hacker is hired to delete a crime she has not yet committed.',
  })
  @IsString()
  @IsNotEmpty()
  storyPremise: string;

  @ApiPropertyOptional({ description: 'Story genre', example: 'Cyberpunk · Thriller' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Desired character count', example: 3, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  characterCount?: number;

  @ApiPropertyOptional({
    description: 'Specific character archetypes requested',
    example: ['Rogue Detective', 'Corporate Enforcer', 'Street Informant'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  archetypes?: string[];
}

export class AiCharacterDto {
  @ApiProperty({ example: 'Dev Malhotra' })
  name: string;

  @ApiProperty({ example: '31' })
  age: string;

  @ApiProperty({ example: 'Protagonist / Disgraced Detective' })
  role: string;

  @ApiProperty({ example: 'Clear his family name before his terminal tremors take his hands.' })
  coreDesire: string;

  @ApiProperty({ example: 'Obsessive distrust of anyone offering help.' })
  fatalFlaw: string;

  @ApiProperty({ example: 'He burned the original forensic log that could have exonerated him.' })
  secret: string;

  @ApiProperty({ example: 'Cynical, rapid-fire Mumbai street Hindi, rarely asks questions.' })
  dialogueVoice: string;

  @ApiProperty({ example: 'Wears an unbuckled leather chronograph set 5 minutes fast.' })
  visualCue: string;
}

export class CharacterForgeResponseDto {
  @ApiProperty({ type: [AiCharacterDto] })
  characters: AiCharacterDto[];
}
