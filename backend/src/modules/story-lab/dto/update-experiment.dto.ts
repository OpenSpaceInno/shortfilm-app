import { IsEnum, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { ExperimentStatusEnum, type ExperimentStatus } from '../../../database/schema/story-lab.schema';

export class UpdateExperimentStatusDto {
  @IsEnum(ExperimentStatusEnum)
  status: ExperimentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateExperimentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  hypothesis?: string;

  @IsOptional()
  @IsEnum(ExperimentStatusEnum)
  status?: ExperimentStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  splitPercentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
