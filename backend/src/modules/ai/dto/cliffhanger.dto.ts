import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CliffhangerRequestDto {
  @ApiProperty({
    description: 'Current episode narrative leading up to the ending beats',
    example: 'Maya plays the incoming voicemail on speaker in front of Arjun.',
  })
  @IsString()
  @IsNotEmpty()
  episodeContext: string;

  @ApiPropertyOptional({
    description: 'Existing draft ending if refining',
    example: 'Maya pauses the voicemail and stares at Arjun.',
  })
  @IsOptional()
  @IsString()
  currentEnding?: string;

  @ApiPropertyOptional({
    description: 'Desired emotional punch or hook style',
    example: 'Shocking revelation subverting trust',
  })
  @IsOptional()
  @IsString()
  hookStyle?: string;
}

export class CliffhangerResponseDto {
  @ApiProperty({
    example:
      'Maya plays the incoming voicemail on speaker. The speaker does not play her future self—it plays Arjun screaming from a location she is standing in right now.',
  })
  cliffhangerHook: string;

  @ApiProperty({
    example:
      'Extreme macro close-up of Maya’s reflection in the cracked smartphone screen as the room lights plunge into black.',
  })
  visualFinalFrame: string;

  @ApiProperty({
    example:
      'Heavy sub-bass pulse dropping abruptly to silence, followed by the faint double-beep of a disconnected call.',
  })
  audioEndingCue: string;

  @ApiProperty({ example: 'CRITICAL' })
  urgencyLevel: string;

  @ApiProperty({
    example: [
      'Audience identity disorientation',
      'Imminent character peril',
      'Subversion of established voice rule',
    ],
  })
  retentionTriggers: string[];
}
