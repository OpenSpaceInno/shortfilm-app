import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BranchDilemmaRequestDto {
  @ApiProperty({
    description: 'Current scene or episode dramatic context',
    example: 'The subway power cuts out. Ananya drops her decryptor chip while Dev aims his firearm.',
  })
  @IsString()
  @IsNotEmpty()
  episodeContext: string;

  @ApiProperty({
    description: 'Key characters involved in the decision point',
    example: ['Dev Malhotra', 'Ananya Roy'],
  })
  @IsArray()
  @IsString({ each: true })
  characters: string[];

  @ApiPropertyOptional({
    description: 'Theme or moral question to emphasize',
    example: 'Self-preservation vs. Duty',
  })
  @IsOptional()
  @IsString()
  dilemmaTheme?: string;
}

export class BranchDilemmaResponseDto {
  @ApiProperty({
    example: 'The subway power cuts out. Ananya drops her decryptor chip while Dev aims his firearm.',
  })
  prompt: string;

  @ApiProperty({ example: 'Retrieve Decryptor Chip from the live railway track' })
  optionA: string;

  @ApiProperty({ example: 'Tackle Ananya before she reaches the emergency exit hatch' })
  optionB: string;

  @ApiProperty({
    example: 'Dev secures the biometric cipher, but Ananya slips into the tunnel maze leaving him trapped.',
  })
  consequenceA: string;

  @ApiProperty({
    example: 'Dev apprehends Ananya, but the decryption key is crushed beneath the oncoming maintenance express.',
  })
  consequenceB: string;

  @ApiProperty({ example: 94 })
  tensionScore: number;

  @ApiProperty({ example: 'Duty vs. Truth (Institutional Justice vs. Personal Exoneration)' })
  moralDilemmaAxis: string;
}
