import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVoteDto {
  @ApiProperty({ description: 'ULID of the choice dilemma being voted on' })
  @IsString()
  @IsNotEmpty()
  choiceId: string;

  @ApiProperty({ description: 'ULID of the selected choice option' })
  @IsString()
  @IsNotEmpty()
  choiceOptionId: string;
}

export class VoteResponseDto {
  @ApiProperty({ description: 'ULID of the vote record' })
  id: string;

  @ApiProperty({ description: 'User ID of the voter' })
  userId: string;

  @ApiProperty({ description: 'Choice ID voted on' })
  choiceId: string;

  @ApiProperty({ description: 'Selected option ID' })
  choiceOptionId: string;

  @ApiProperty({ description: 'Community participation XP awarded' })
  xpAwarded: number;

  @ApiProperty({ description: 'Timestamp when vote was cast' })
  createdAt: Date;
}

export class ChoiceOptionVoteStatDto {
  @ApiProperty({ description: 'Option ULID' })
  optionId: string;

  @ApiProperty({ description: 'Option text' })
  optionText: string;

  @ApiProperty({ description: 'Total votes for this option' })
  voteCount: number;

  @ApiProperty({ description: 'Percentage of total votes (0-100)' })
  percentage: number;
}

export class ChoiceVoteStatsDto {
  @ApiProperty({ description: 'Choice ULID' })
  choiceId: string;

  @ApiProperty({ description: 'Total votes cast across all options' })
  totalVotes: number;

  @ApiProperty({ description: 'Breakdown of options with vote counts', type: [ChoiceOptionVoteStatDto] })
  options: ChoiceOptionVoteStatDto[];
}
