import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePredictionDto {
  @ApiProperty({ description: 'Story ULID the prediction belongs to' })
  @IsString()
  @IsNotEmpty()
  storyId: string;

  @ApiProperty({ description: 'Prediction prompt question' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'Voting closure deadline timestamp (ISO string)' })
  @IsDateString()
  closesAt: string;

  @ApiPropertyOptional({ description: 'Episode ULID where the outcome will be revealed' })
  @IsOptional()
  @IsString()
  revealEpisodeId?: string;

  @ApiProperty({ description: 'Candidate outcome answers for audience to choose', type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];
}

export class SubmitPredictionDto {
  @ApiProperty({ description: 'Prediction ULID' })
  @IsString()
  @IsNotEmpty()
  predictionId: string;

  @ApiProperty({ description: 'Selected option ULID' })
  @IsString()
  @IsNotEmpty()
  predictionOptionId: string;
}

export class ResolvePredictionDto {
  @ApiProperty({ description: 'Winning prediction option ULID' })
  @IsString()
  @IsNotEmpty()
  winningOptionId: string;
}

export class PredictionOptionDto {
  @ApiProperty({ description: 'Option ULID' })
  id: string;

  @ApiProperty({ description: 'Option text' })
  optionText: string;

  @ApiPropertyOptional({ description: 'Total predictions placed on this option' })
  voteCount?: number;
}

export class UserPredictionSummaryDto {
  @ApiProperty({ description: 'Selected option ULID' })
  predictionOptionId: string;

  @ApiPropertyOptional({ description: 'Outcome result after resolution', nullable: true })
  isCorrect: boolean | null;

  @ApiProperty({ description: 'XP points awarded' })
  xpAwarded: number;
}

export class PredictionResponseDto {
  @ApiProperty({ description: 'Prediction ULID' })
  id: string;

  @ApiProperty({ description: 'Story ULID' })
  storyId: string;

  @ApiProperty({ description: 'Prediction question' })
  question: string;

  @ApiProperty({ description: 'Status: OPEN, RESOLVED, CANCELLED' })
  status: string;

  @ApiProperty({ description: 'Closure deadline' })
  closesAt: Date;

  @ApiPropertyOptional({ description: 'Winning option ID if resolved', nullable: true })
  winningOptionId?: string | null;

  @ApiProperty({ description: 'List of answer options', type: [PredictionOptionDto] })
  options: PredictionOptionDto[];

  @ApiPropertyOptional({ description: 'Current authenticated user prediction record if placed' })
  userPrediction?: UserPredictionSummaryDto | null;
}
