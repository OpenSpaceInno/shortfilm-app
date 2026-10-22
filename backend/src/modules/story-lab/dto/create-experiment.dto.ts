import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExperimentVariantInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  versionId?: string;

  @IsOptional()
  @IsString()
  nodeId?: string;

  @IsOptional()
  configJson?: Record<string, any>;
}

export class CreateExperimentDto {
  @IsString()
  @IsNotEmpty()
  storyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  hypothesis: string;

  @IsOptional()
  @IsString()
  targetMetric?: string = 'completion_rate';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  splitPercentage?: number = 50;

  @ValidateNested()
  @Type(() => ExperimentVariantInputDto)
  variantA: ExperimentVariantInputDto;

  @ValidateNested()
  @Type(() => ExperimentVariantInputDto)
  variantB: ExperimentVariantInputDto;
}
