import { IsString, IsNotEmpty, IsInt, Min, IsOptional, MaxLength } from 'class-validator';

export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsInt()
  @Min(1)
  seasonNumber: number;

  @IsString()
  @IsOptional()
  synopsis?: string;
}

export interface SeasonResponseDto {
  id: string;
  storyId: string;
  title: string;
  seasonNumber: number;
  synopsis?: string | null;
  createdAt: Date;
}
