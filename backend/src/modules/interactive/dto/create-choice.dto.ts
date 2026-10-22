import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateChoiceDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsDateString()
  votingOpensAt?: string;

  @IsOptional()
  @IsDateString()
  votingEndsAt?: string;
}

export class CreateChoiceOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  destinationNodeId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number = 1;
}
