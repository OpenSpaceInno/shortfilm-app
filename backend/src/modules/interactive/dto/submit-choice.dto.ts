import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitChoiceDto {
  @ApiProperty({ description: 'ULID of the choice dilemma being resolved' })
  @IsString()
  @IsNotEmpty()
  choiceId: string;

  @ApiProperty({ description: 'ULID of the chosen branch option' })
  @IsString()
  @IsNotEmpty()
  choiceOptionId: string;

  @ApiProperty({ description: 'ULID of the active published story version' })
  @IsString()
  @IsNotEmpty()
  storyVersionId: string;
}

export interface UserChoiceDto {
  id: string;
  userId: string;
  choiceId: string;
  choiceOptionId: string;
  storyVersionId: string;
  isFallback: boolean;
  createdAt: Date;
}

export interface DestinationNodeDto {
  id: string;
  episodeId: string;
  episodeTitle?: string;
  episodeNumber?: number;
  nodeType: string;
  playbackUrl: string | null;
  hasChoice: boolean;
}

export interface ChoiceResolutionResponseDto {
  userChoice: UserChoiceDto;
  destinationNode: DestinationNodeDto;
  xpAwarded: number;
}
